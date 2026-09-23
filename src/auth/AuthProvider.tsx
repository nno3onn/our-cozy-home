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
  const previousUserId = useRef<string | null>(null);

  const loadOnboarding = useCallback(async (userId: string) => {
    setOnboarding('loading');
    setOnboardingError(null);
    const [profileResult, animalResult] = await Promise.all([
      client.from('profiles').select('id').eq('id', userId).maybeSingle(),
      client.from('animals').select('id').eq('profile_id', userId).maybeSingle(),
    ]);
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
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        dispatch({ type: 'signed_in', userId: data.session.user.id });
        void loadOnboarding(data.session.user.id);
      } else {
        setOnboarding('loading');
        setOnboardingError(null);
        dispatch({ type: 'resolved_without_session' });
      }
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch({ type: 'signed_in', userId: session.user.id });
        void loadOnboarding(session.user.id);
      } else {
        setOnboarding('loading');
        setOnboardingError(null);
        dispatch({ type: 'signed_out' });
      }
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [client, loadOnboarding]);

  useEffect(() => {
    if (state.status === 'signed_in') previousUserId.current = state.userId;
    if (state.status === 'signed_out' && previousUserId.current) {
      clearScopedCaches(queryClient, previousUserId.current);
      previousUserId.current = null;
    }
  }, [queryClient, state]);

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
    async signOut() { await client.auth.signOut(); },
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
