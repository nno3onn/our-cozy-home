import type { Href } from 'expo-router';

import type { OnboardingStatus } from './onboardingStatus';
import type { SessionState } from './sessionState';

type RouteGuardState = { status: SessionState['status']; onboarding: OnboardingStatus };

export function getAuthRedirect(state: RouteGuardState, segments: readonly string[]): Href | null {
  if (state.status === 'loading') return null;
  if (state.status === 'signed_out') return segments[0] === 'auth' || segments[0] === 'invite' ? null : '/auth/sign-in';
  if (state.onboarding === 'loading' || state.onboarding === 'unavailable') return null;
  if (state.onboarding === 'required') return segments[0] === 'onboarding' ? null : '/onboarding';
  return segments[0] === 'auth' || segments[0] === 'onboarding' ? '/' : null;
}

export function getPendingInviteRedirect(pendingInvite: string | null, segments: readonly string[]): Href | null {
  if (!pendingInvite || segments[0] === 'invite') return null;
  return `/invite/${pendingInvite}` as Href;
}
