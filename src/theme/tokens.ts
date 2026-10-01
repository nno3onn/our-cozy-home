export const colors = {
  cream: '#FFF8E8',
  paper: '#FFFCF4',
  surface: '#FFF7EA',
  floor: '#F0DFC0',
  ink: '#38332E',
  mutedInk: '#6D645B',
  peach: '#F2A98C',
  coral: '#F18191',
  mint: '#91C9AF',
  sky: '#94BFE0',
  lilac: '#B7A8D8',
  line: '#E8DECF',
  danger: '#B5534D',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  card: 18,
  sheet: 24,
  lg: 22,
  scene: 24,
  pill: 999,
} as const;

export const elevation = {
  soft: {
    shadowColor: '#8C7056',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

export const typeScale = {
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 15, lineHeight: 21, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
} as const;

export const motion = {
  quick: 140,
  standard: 220,
  relaxed: 420,
} as const;

export const responsiveBreakpoints = {
  medium: 600,
  wide: 900,
} as const;
