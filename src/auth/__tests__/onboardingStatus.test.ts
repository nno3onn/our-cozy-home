import { deriveOnboardingStatus } from '../onboardingStatus';

describe('onboarding status', () => {
  it('requires onboarding when either the profile or personal animal is absent', () => {
    expect(deriveOnboardingStatus({ hasProfile: false, hasAnimal: false })).toBe('required');
    expect(deriveOnboardingStatus({ hasProfile: true, hasAnimal: false })).toBe('required');
    expect(deriveOnboardingStatus({ hasProfile: false, hasAnimal: true })).toBe('required');
  });

  it('is complete only after both the profile and personal animal exist', () => {
    expect(deriveOnboardingStatus({ hasProfile: true, hasAnimal: true })).toBe('complete');
  });
});
