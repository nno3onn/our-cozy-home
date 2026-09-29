export const illustratedColors = {
  wall: '#FFF5E6',
  paper: '#FFFDF8',
  floor: '#EBCB9C',
  cocoa: '#4B372B',
  peach: '#F49A86',
  sage: '#9FC9B2',
  sky: '#B8D8EB',
  honey: '#F3C76D',
  line: '#E7CFAF',
} as const;

export const illustratedRadii = {
  room: 28,
  sheet: 28,
  card: 18,
  pill: 999,
} as const;

export const illustratedElevation = {
  card: {
    elevation: 4,
    shadowColor: '#8D684C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
} as const;
