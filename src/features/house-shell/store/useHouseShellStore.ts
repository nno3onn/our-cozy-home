import { create } from 'zustand';

export type HouseOverlay =
  | 'none'
  | 'animal'
  | 'decorate'
  | 'attendance'
  | 'invite'
  | 'memory-complete';

export type DecorateSegment = 'inventory' | 'shop';

type HouseShellState = {
  overlay: HouseOverlay;
  selectedAnimalId: string | null;
  decorateSegment: DecorateSegment;
  openAnimal: (animalId: string) => void;
  openOverlay: (overlay: Exclude<HouseOverlay, 'none'>) => void;
  closeOverlay: () => void;
  setDecorateSegment: (segment: DecorateSegment) => void;
  reset: () => void;
};

const initialState = {
  overlay: 'none' as const,
  selectedAnimalId: null,
  decorateSegment: 'inventory' as const,
};

export const useHouseShellStore = create<HouseShellState>((set) => ({
  ...initialState,
  openAnimal: (selectedAnimalId) => set({ overlay: 'animal', selectedAnimalId }),
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: 'none' }),
  setDecorateSegment: (decorateSegment) => set({ decorateSegment }),
  reset: () => set(initialState),
}));
