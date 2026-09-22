import { getAuthRedirect } from '../routeGuard';

describe('auth route guard', () => {
  it('sends signed-in users without onboarding to the onboarding screen', () => {
    expect(getAuthRedirect({ status: 'signed_in', onboarding: 'required' }, [])).toBe('/onboarding');
  });

  it('sends completed users away from onboarding and authentication screens', () => {
    expect(getAuthRedirect({ status: 'signed_in', onboarding: 'complete' }, ['onboarding'])).toBe('/');
    expect(getAuthRedirect({ status: 'signed_in', onboarding: 'complete' }, ['auth', 'sign-in'])).toBe('/');
  });

  it('keeps a signed-in user on the current screen while onboarding status is loading', () => {
    expect(getAuthRedirect({ status: 'signed_in', onboarding: 'loading' }, ['onboarding'])).toBeNull();
  });

  it('allows a signed-out user to inspect an invite without entering the app', () => {
    expect(getAuthRedirect({ status: 'signed_out', onboarding: 'loading' }, ['invite', 'token'])).toBeNull();
  });
});
