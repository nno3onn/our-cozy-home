import { useHouseShellStore } from '../useHouseShellStore';

describe('useHouseShellStore', () => {
  beforeEach(() => {
    useHouseShellStore.getState().reset();
  });

  it('opens the selected animal detail overlay', () => {
    useHouseShellStore.getState().openAnimal('animal-a');

    expect(useHouseShellStore.getState()).toMatchObject({
      overlay: 'animal',
      selectedAnimalId: 'animal-a',
    });
  });

  it('closes an overlay without clearing the selected animal', () => {
    useHouseShellStore.getState().openAnimal('animal-a');
    useHouseShellStore.getState().closeOverlay();

    expect(useHouseShellStore.getState()).toMatchObject({
      overlay: 'none',
      selectedAnimalId: 'animal-a',
    });
  });

  it('keeps the selected decorate segment separately from the active overlay', () => {
    useHouseShellStore.getState().openOverlay('decorate');
    useHouseShellStore.getState().setDecorateSegment('shop');

    expect(useHouseShellStore.getState()).toMatchObject({
      overlay: 'decorate',
      decorateSegment: 'shop',
    });
  });
});
