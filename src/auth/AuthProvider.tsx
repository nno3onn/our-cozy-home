import type { SupabaseClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useContext, useEffect, useReducer, useRef } from 'react';

import { clearScopedCaches } from '@/repositories/queryKeys';
import type { Database } from '@/types/database.generated';

import { reduceSessionState, type SessionState } from './sessionState';

type AuthContextValue = {
  state: SessionState;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  setPendingInvite(token: string): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, client }: PropsWithChildren<{ client: SupabaseClient<Database> }>) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reduceSessionState, { status: 'loading', pendingInvite: null });
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      dispatch(data.session ? { type: 'signed_in', userId: data.session.user.id } : { type: 'resolved_without_session' });
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch({ type: 'signed_in', userId: session.user.id });
      } else {
        dispatch({ type: 'signed_out' });
      }
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (state.status === 'signed_in') previousUserId.current = state.userId;
    if (state.status === 'signed_out' && previousUserId.current) {
      clearScopedCaches(queryClient, previousUserId.current);
      previousUserId.current = null;
    }
  }, [queryClient, state]);

  const value: AuthContextValue = {
    state,
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
