type OnboardingInput = { displayName: string; animalName: string; pointColor: string };

const namePattern = /^[A-Za-z0-9가-힣 _-]{1,20}$/;

export function validateOnboarding({ displayName, animalName, pointColor }: OnboardingInput): string | null {
  if (!namePattern.test(displayName.trim())) return '표시 이름을 확인해 주세요.';
  if (!namePattern.test(animalName.trim())) return '동물 이름을 확인해 주세요.';
  if (!/^#[0-9A-Fa-f]{6}$/.test(pointColor)) return '포인트 색상을 확인해 주세요.';
  return null;
}
