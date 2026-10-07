import { colors, radii, typeScale } from '../tokens';

describe('semantic theme tokens', () => {
  it('uses the approved neutral palette and primary action color', () => {
    expect(colors.background).toBe('#F7F8FA');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.textPrimary).toBe('#191F28');
    expect(colors.brand).toBe('#3182F6');
  });

  it('defines the body type and control shape contract', () => {
    expect(typeScale.body).toMatchObject({ fontSize: 16, lineHeight: 24 });
    expect(radii.control).toBe(14);
  });

  it('keeps legacy color aliases while screens migrate', () => {
    expect(colors.cream).toBe(colors.background);
    expect(colors.ink).toBe(colors.textPrimary);
  });
});
