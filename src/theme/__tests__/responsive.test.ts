import { getResponsiveLayout } from '../responsive';

describe('getResponsiveLayout', () => {
  it('keeps the compact contract through 599px', () => {
    expect(getResponsiveLayout(599)).toMatchObject({
      breakpoint: 'compact',
      gridColumns: 1,
      pageGutter: 16,
    });
  });

  it('switches to the tablet contract at 600px', () => {
    expect(getResponsiveLayout(600)).toMatchObject({
      breakpoint: 'medium',
      gridColumns: 2,
      pageGutter: 24,
    });
  });

  it('switches to the wide contract at 900px', () => {
    expect(getResponsiveLayout(900)).toMatchObject({
      breakpoint: 'wide',
      gridColumns: 3,
      pageGutter: 32,
    });
  });
});
