export type SessionState =
  | { status: 'loading'; pendingInvite: string | null }
  | { status: 'signed_out'; pendingInvite: string | null }
  | { status: 'signed_in'; userId: string; pendingInvite: string | null };

export type SessionEvent =
  | { type: 'resolved_without_session' }
  | { type: 'signed_in'; userId: string }
  | { type: 'signed_out' }
  | { type: 'invite_received'; token: string };

export function reduceSessionState(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'resolved_without_session':
      return { status: 'signed_out', pendingInvite: state.pendingInvite };
    case 'signed_in':
      return { status: 'signed_in', userId: event.userId, pendingInvite: state.pendingInvite };
    case 'signed_out':
      return { status: 'signed_out', pendingInvite: null };
    case 'invite_received':
      return state.status === 'signed_in'
        ? state
        : { ...state, pendingInvite: event.token };
  }
}
