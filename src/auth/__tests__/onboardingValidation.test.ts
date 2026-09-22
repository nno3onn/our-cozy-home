import { validateOnboarding } from '../onboardingValidation';

describe('onboarding validation', () => {
  it('accepts Korean names and a six-digit point color', () => {
    expect(validateOnboarding({ displayName: '모모', animalName: '콩이', pointColor: '#FF99AA' })).toBeNull();
  });
  it('rejects blank or overlong names before submitting to the server', () => {
    expect(validateOnboarding({ displayName: ' ', animalName: '콩이', pointColor: '#FF99AA' })).toBe('표시 이름을 확인해 주세요.');
    expect(validateOnboarding({ displayName: '모모', animalName: 'a'.repeat(21), pointColor: '#FF99AA' })).toBe('동물 이름을 확인해 주세요.');
  });

  it('matches the server character contract instead of accepting every Unicode letter', () => {
    expect(validateOnboarding({ displayName: 'Momo', animalName: '小豆', pointColor: '#FF99AA' })).toBe('동물 이름을 확인해 주세요.');
  });
});
