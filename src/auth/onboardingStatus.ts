export type OnboardingStatus = 'loading' | 'required' | 'complete' | 'unavailable';

export function deriveOnboardingStatus({
  hasProfile,
  hasAnimal,
}: {
  hasProfile: boolean;
  hasAnimal: boolean;
}): Extract<OnboardingStatus, 'required' | 'complete'> {
  return hasProfile && hasAnimal ? 'complete' : 'required';
}
