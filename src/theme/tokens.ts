const semanticColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F2F4F6',
  textPrimary: '#191F28',
  textSecondary: '#4E5968',
  textTertiary: '#8B95A1',
  border: '#E5E8EB',
  brand: '#3182F6',
  brandPressed: '#1B64DA',
  brandSoft: '#E8F3FF',
  success: '#20A464',
  successSoft: '#E8F8F0',
  warning: '#F59F00',
  warningSoft: '#FFF6DC',
  danger: '#E42939',
  dangerSoft: '#FDEBEC',
  scrim: 'rgba(25,31,40,0.46)',
  inverse: '#FFFFFF',
} as const;

export const colors = {
  ...semanticColors,
  // Compatibility aliases. Remove after every screen uses semantic names.
  cream: semanticColors.background,
  paper: semanticColors.surface,
  floor: '#F0DFC0',
  ink: semanticColors.textPrimary,
  mutedInk: semanticColors.textSecondary,
  peach: '#F2A98C',
  coral: '#F18191',
  mint: '#91C9AF',
  sky: '#94BFE0',
  lilac: '#B7A8D8',
  line: semanticColors.border,
  white: semanticColors.inverse,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radii = {
  sm: 8,
  control: 14,
  md: 14,
  card: 20,
  lg: 20,
  sheet: 28,
  scene: 24,
  pill: 999,
} as const;

export const elevation = {
  floating: {
    shadowColor: semanticColors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  // Compatibility alias for existing floating surfaces.
  soft: {
    shadowColor: semanticColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const typeScale = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  headline: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  // Compatibility alias for screens awaiting migration.
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
} as const;

export const motion = {
  quick: 140,
  standard: 220,
  relaxed: 420,
} as const;

export const zIndex = {
  content: 0,
  tabs: 10,
  bottomAction: 20,
  sheet: 30,
  snackbar: 40,
  modal: 50,
} as const;

export const responsiveBreakpoints = {
  medium: 600,
  wide: 900,
} as const;
