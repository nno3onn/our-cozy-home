import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { curtainArtBounds } from '@/game/room/curtainLayout';
import { ITEM_CATALOG } from '@/catalog/items';
import { RoomScene } from '../RoomScene';
import { getIllustratedAsset } from '../assetManifest';

it.each([[320, 320], [1280, 720], [320, 600]])('replaces baked curtains and follows the background cover transform at %ix%i', async (width, height) => {
  for (const item of ITEM_CATALOG.filter(item => item.category === 'curtain')) {
    const view = await render(<RoomScene animals={[]} members={[]} isActive={false} selectedAnimalId={null}
      roomItems={[{ slotId: 'window', itemId: item.id, name: item.nameKo }]} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} />);
    await fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'), 'layout', { nativeEvent: { layout: { width, height } } });
    expect(view.getByTestId('room-backdrop-image').props.source).toEqual(getIllustratedAsset('illustrated:room:sunny-bare-window')?.source);
    const image = view.getByLabelText(item.nameKo);
    expect(image.props.resizeMode).toBe('stretch');
    const scale = Math.max(width / 1536, height / 1024);
    const style = StyleSheet.flatten(image.props.style);
    const optical = curtainArtBounds[item.id];
    expect(style.left + optical.left * style.width).toBeCloseTo((width - 1536 * scale) / 2 + 344 * scale);
    expect(style.left + optical.right * style.width).toBeCloseTo((width - 1536 * scale) / 2 + 1192 * scale);
    expect(style.top + optical.top * style.height).toBeCloseTo((height - 1024 * scale) / 2 + 6 * scale);
    expect(style.top + optical.bottom * style.height).toBeCloseTo((height - 1024 * scale) / 2 + (item.id === 'curtain-cafe-check' ? 390 : 515) * scale);
    await view.rerender(<RoomScene animals={[]} members={[]} isActive={false} selectedAnimalId={null} roomItems={[]} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} />);
    expect(view.getByTestId('room-backdrop-image').props.source).toEqual(getIllustratedAsset('illustrated:room:sunny')?.source);
    expect(view.queryByLabelText(item.nameKo)).toBeNull();
    await view.unmount();
  }
});
