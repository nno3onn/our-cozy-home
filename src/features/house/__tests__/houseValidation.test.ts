import { validateHouseName } from '../houseValidation';

describe('house name validation', () => {
  it('accepts a Korean house name within the server limit', () => {
    expect(validateHouseName('도란도란 우리집')).toBeNull();
  });

  it('rejects blank and overlong names before an RPC request is created', () => {
    expect(validateHouseName('   ')).toBe('집 이름을 확인해 주세요.');
    expect(validateHouseName('가'.repeat(31))).toBe('집 이름은 30자 이하여야 해요.');
  });
});
