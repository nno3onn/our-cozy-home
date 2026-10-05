import { fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import type { Animal, Member } from '@/domain/models';

import { RoomScene } from '../RoomScene';

const members: Member[] = [
  { id: 'm1', userId: 'u1', displayName: '다온', pointColor: '#F49A86', role: 'admin' },
  { id: 'm2', userId: 'u2', displayName: '하솜', pointColor: '#9FC9B2', role: 'member' },
  { id: 'm3', userId: 'u3', displayName: '보라', pointColor: '#B8D8EB', role: 'member' },
  { id: 'm4', userId: 'u4', displayName: '유자', pointColor: '#F3C76D', role: 'member' },
];

const animals: Animal[] = members.map((member, index) => ({
  id: `a${index + 1}`,
  ownerId: member.userId,
  name: `${member.displayName}이`,
  species: index % 2 === 0 ? 'rabbit' : 'cat',
  state: 'idle',
}));

describe('RoomScene', () => {
  it('keeps four companion controls separate and opens memory furniture', async () => {
    const onOpenMemory = jest.fn();
    const onSelectAnimal = jest.fn();
    const view = await render(
      <RoomScene
        accentFurniture={{ color: '#D9AD85', itemId: 'table-round-cookie', name: '쿠키 탁자' }}
        animals={animals}
        isActive
        members={members}
        memoryFurniture={{ itemId: 'memory-radio-picnic-radio', memoryId: 'memory-1', name: '소풍 라디오' }}
        onOpenMemory={onOpenMemory}
        onSelectAnimal={onSelectAnimal}
        selectedAnimalId={null}
      />,
    );

    for (const animal of animals) expect(view.getByLabelText(`${animal.name} 동물 선택`)).toBeOnTheScreen();
    fireEvent.press(view.getByLabelText('소풍 라디오 추억 열기'));
    expect(onOpenMemory).toHaveBeenCalledWith('memory-1');
    expect(view.getByLabelText('소풍 라디오')).toBeOnTheScreen();
    expect(view.getByLabelText('둥근 쿠키 탁자')).toBeOnTheScreen();
    expect(view.queryByLabelText('포근 타원 러그')).toBeNull();
    expect(view.queryByLabelText('동글 고무나무')).toBeNull();
  });

  it('uses a coloured name ribbon, not an online-state indicator', async () => {
    const view = await render(
      <RoomScene animals={animals.slice(0, 1)} isActive members={members.slice(0, 1)} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} selectedAnimalId={null} />,
    );

    expect(view.getByText('다온이')).toBeOnTheScreen();
    expect(view.queryByLabelText(/접속/)).toBeNull();
  });

  it('uses the wide scene bounds from the shared responsive breakpoint', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 720, scale: 1, width: 900 });
    const view = await render(
      <RoomScene animals={animals} isActive members={members} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} selectedAnimalId={null} />,
    );

    expect(view.getByLabelText('네 동물이 함께 지내는 방').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 530, width: 530 })]),
    );
  });

  it('scales animal artwork with the room instead of keeping a fixed minimum visual size', async () => {
    const view = await render(
      <RoomScene animals={animals} isActive members={members} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} selectedAnimalId={null} />,
    );

    fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'), 'layout', {
      nativeEvent: { layout: { height: 320, width: 320 } },
    });

    expect(ReactNative.StyleSheet.flatten(view.getByTestId('animal-sprite-a1').props.style)).toEqual(
      expect.objectContaining({ height: 70.4, width: 70.4 }),
    );
  });

  it('scales interactive memory furniture with the same room ratio', async () => {
    const view = await render(
      <RoomScene
        accentFurniture={{ color: '#D9AD85', itemId: 'cushion-shell', name: '복숭아 조개 쿠션' }}
        animals={animals}
        isActive
        members={members}
        memoryFurniture={{ itemId: 'memory-radio-picnic-radio', memoryId: 'memory-1', name: '소풍 라디오' }}
        onOpenMemory={jest.fn()}
        onSelectAnimal={jest.fn()}
        selectedAnimalId={null}
      />,
    );

    fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'), 'layout', {
      nativeEvent: { layout: { height: 320, width: 320 } },
    });

    const memoryStyle = ReactNative.StyleSheet.flatten(view.getByTestId('memory-furniture').props.style);
    expect(memoryStyle.height).toBeCloseTo(47.36);
    expect(memoryStyle.left).toBeCloseTo(6.4);
    expect(memoryStyle.top).toBeCloseTo(124.8);
    expect(memoryStyle.width).toBeCloseTo(56);

    const upperLeftAnimalStyle = ReactNative.StyleSheet.flatten(view.getByLabelText('다온이 동물 선택').props.style);
    expect(memoryStyle.left + memoryStyle.width + 8).toBeLessThanOrEqual(upperLeftAnimalStyle.left);
  });
});
