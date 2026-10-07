import { appFonts, fontFamilies } from '../fonts';

describe('app fonts', () => {
  it('maps the bundled Pretendard variable font to the shared sans family', () => {
    expect(appFonts.Pretendard).toBeTruthy();
    expect(fontFamilies.sans).toBe('Pretendard');
  });
});
