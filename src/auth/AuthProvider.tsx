import type { SupabaseClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';

import { clearScopedCaches } from '@/repositories/queryKeys';
import type { Database } from '@/types/database.generated';

import { reduceSessionState, type SessionState } from './sessionState';
import type { AnimalSpecies } from '@/domain/models';
import { deriveOnboardingStatus, type OnboardingStatus } from './onboardingStatus';

type AuthContextValue = {
  state: SessionState;
  onboarding: OnboardingStatus;
  onboardingError: string | null;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  signOutError?: string | null;
  registerDataScope?: (retire: () => void) => () => void;
  setPendingInvite(token: string): void;
  completeOnboarding(input: { displayName: string; pointColor: string; animalName: string; species: AnimalSpecies }): Promise<string | null>;
  refreshOnboarding(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, client }: PropsWithChildren<{ client: SupabaseClient<Database> }>) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reduceSessionState, { status: 'loading', pendingInvite: null });
  const [onboarding, setOnboarding] = useState<OnboardingStatus>('loading');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const identity = useRef({ userId: null as string | null, generation: 0 });
  const [identityGeneration, setIdentityGeneration] = useState(0);
  const authEvents = useRef(0);
  const scopes = useRef(new Set<() => void>());
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const registerDataScope = useCallback((retire: () => void) => {
    scopes.current.add(retire);
    return () => { scopes.current.delete(retire); };
  }, []);
  const retireScopes = useCallback(() => { for (const retire of scopes.current) retire(); }, []);

  const loadOnboarding = useCallback(async (userId: string) => {
    if (identity.current.userId !== userId) return;
    const generation = identity.current.generation;
    setOnboarding('loading');
    setOnboardingError(null);
    const [profileResult, animalResult] = await Promise.all([
      client.from('profiles').select('id').eq('id', userId).maybeSingle(),
      client.from('animals').select('id').eq('profile_id', userId).maybeSingle(),
    ]);
    if (identity.current.userId !== userId || identity.current.generation !== generation) return;
    const error = profileResult.error ?? animalResult.error;
    if (error) {
      setOnboarding('unavailable');
      setOnboardingError(error.message);
      return;
    }
    setOnboarding(deriveOnboardingStatus({ hasProfile: Boolean(profileResult.data), hasAnimal: Boolean(animalResult.data) }));
  }, [client]);

  const refreshOnboarding = useCallback(async () => {
    if (state.status === 'signed_in') await loadOnboarding(state.userId);
  }, [loadOnboarding, state]);

  useEffect(() => {
    let active = true;
    const applySession = (userId: string | null) => {
      const previous = identity.current.userId;
      if (previous !== userId) {
        // Close event acceptance and private reads before publishing a new user.
        retireScopes();
        if (previous) clearScopedCaches(queryClient, previous);
        identity.current = { userId, generation: identity.current.generation + 1 };
        setIdentityGeneration(identity.current.generation);
      }
      if (userId) {
        dispatch({ type: 'signed_in', userId });
        if (previous !== userId) {
          setSignOutError(null);
          void loadOnboarding(userId);
        }
      } else {
        setOnboarding('loading');
        setOnboardingError(null);
        dispatch({ type: 'signed_out' });
      }
    };
    const bootstrap = authEvents.current;
    void client.auth.getSession().then(({ data }) => {
      if (active && authEvents.current === bootstrap) applySession(data.session?.user.id ?? null);
    }).catch(() => {
      if (active && authEvents.current === bootstrap) applySession(null);
    });
    const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
      authEvents.current++;
      if (!active) return;
      if (event === 'TOKEN_REFRESHED' && session?.user.id !== identity.current.userId) return;
      applySession(session?.user.id ?? null);
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [client, loadOnboarding, queryClient, retireScopes]);

  const renderedUserId = state.status === 'signed_in' ? state.userId : null;
  const value: AuthContextValue = {
    state,
    onboarding,
    onboardingError,
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    async signUp(email, password) {
      const { error } = await client.auth.signUp({ email, password });
      return error?.message ?? null;
    },
    async signOut() {
      if (identity.current.userId !== renderedUserId || identity.current.generation !== identityGeneration) return;
      const generation = identity.current.generation;
      setSignOutError(null);
      retireScopes();
      try {
        const { error } = await client.auth.signOut();
        if (error && identity.current.generation === generation) setSignOutError('연결을 확인한 뒤 다시 로그아웃해 주세요.');
      } catch {
        if (identity.current.generation === generation) setSignOutError('연결을 확인한 뒤 다시 로그아웃해 주세요.');
      }
    },
    signOutError,
    registerDataScope,
    setPendingInvite(token) { dispatch({ type: 'invite_received', token }); },
    async completeOnboarding(input) {
      const { error } = await client.rpc('complete_onboarding' as never, {
        p_display_name: input.displayName,
        p_point_color: input.pointColor,
        p_animal_name: input.animalName,
        p_species: input.species,
      } as never);
      if (!error) {
        setOnboarding('complete');
        setOnboardingError(null);
      }
      return error?.message ?? null;
    },
    refreshOnboarding,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('auth_provider_missing');
  return value;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
