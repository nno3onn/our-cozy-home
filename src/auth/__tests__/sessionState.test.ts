import { reduceSessionState } from '../sessionState';

describe('session state', () => {
  it('keeps a pending invite while a signed-out user authenticates', () => {
    const withInvite = reduceSessionState({ status: 'signed_out', pendingInvite: null }, {
      type: 'invite_received', token: 'invite-token',
    });
    const signedIn = reduceSessionState(withInvite, { type: 'signed_in', userId: 'user-a' });

    expect(signedIn).toEqual({ status: 'signed_in', userId: 'user-a', pendingInvite: 'invite-token' });
  });

  it('clears user identity and pending invite on sign out', () => {
    expect(reduceSessionState({ status: 'signed_in', userId: 'user-a', pendingInvite: 'token' }, {
      type: 'signed_out',
    })).toEqual({ status: 'signed_out', pendingInvite: null });
  });
});
