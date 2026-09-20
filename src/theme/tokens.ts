export const colors = {
  cream: '#FFF8E8',
  paper: '#FFFCF4',
  floor: '#F0DFC0',
  ink: '#38332E',
  mutedInk: '#6D645B',
  peach: '#F2A98C',
  mint: '#91C9AF',
  sky: '#94BFE0',
  lilac: '#B7A8D8',
  line: '#D8C8AB',
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
  lg: 22,
  pill: 999,
} as const;

export const typeScale = {
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  heading: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
} as const;

export const motion = {
  quick: 140,
  standard: 220,
  relaxed: 420,
} as const;
