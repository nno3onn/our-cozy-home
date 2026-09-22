const houseNamePattern = /^[A-Za-z0-9가-힣 _-]{1,30}$/;

export function validateHouseName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return '집 이름을 확인해 주세요.';
  if (trimmed.length > 30) return '집 이름은 30자 이하여야 해요.';
  if (!houseNamePattern.test(trimmed)) return '집 이름을 확인해 주세요.';
  return null;
}
