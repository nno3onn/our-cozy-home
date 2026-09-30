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
        animals={animals}
        isActive
        members={members}
        memoryFurniture={{ memoryId: 'memory-1', name: '소풍 라디오' }}
        onOpenMemory={onOpenMemory}
        onSelectAnimal={onSelectAnimal}
        selectedAnimalId={null}
      />,
    );

    for (const animal of animals) expect(view.getByLabelText(`${animal.name} 동물 선택`)).toBeOnTheScreen();
    fireEvent.press(view.getByLabelText('소풍 라디오 추억 열기'));
    expect(onOpenMemory).toHaveBeenCalledWith('memory-1');
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
});
