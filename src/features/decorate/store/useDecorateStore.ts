import { create } from 'zustand';

type DecorateState = {
  selectedOwnedItemId: string | null;
  setSelectedOwnedItemId: (id: string) => void;
  clearSelection: () => void;
};

export const useDecorateStore = create<DecorateState>((set) => ({
  selectedOwnedItemId: null,
  setSelectedOwnedItemId: (selectedOwnedItemId) => set({ selectedOwnedItemId }),
  clearSelection: () => set({ selectedOwnedItemId: null }),
}));
