import { responsiveBreakpoints } from './tokens';

export type Breakpoint = 'compact' | 'medium' | 'wide';

export type ResponsiveLayout = {
  breakpoint: Breakpoint;
  bottomSafeSpace: number;
  gridColumns: 1 | 2 | 3 | 4;
  pageGutter: number;
};

export function getResponsiveLayout(width: number): ResponsiveLayout {
  if (width < responsiveBreakpoints.medium) {
    return { breakpoint: 'compact', bottomSafeSpace: 88, gridColumns: 1, pageGutter: 16 };
  }

  if (width < responsiveBreakpoints.wide) {
    return { breakpoint: 'medium', bottomSafeSpace: 88, gridColumns: 2, pageGutter: 24 };
  }

  return { breakpoint: 'wide', bottomSafeSpace: 0, gridColumns: 3, pageGutter: 32 };
}
