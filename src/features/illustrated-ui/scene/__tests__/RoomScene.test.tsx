import { ITEM_CATALOG } from '@/catalog/items';
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


it.each([320,1280])('renders all 35 decorations in every allowed slot at %i',async width=>{
 const decorations=ITEM_CATALOG.filter(i=>i.source==='shop'&&!i.consumable);
 expect(decorations).toHaveLength(35);
 for(const item of decorations)for(const slotId of item.allowedSlotIds){
  const view=await render(<RoomScene animals={[]} members={[]} isActive={false} selectedAnimalId={null} roomItems={[{slotId,itemId:item.id,name:item.nameKo}]} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()}/>);
  await fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'),'layout',{nativeEvent:{layout:{width,height:width}}});
  const style=ReactNative.StyleSheet.flatten(view.getByTestId(`placed-room-${slotId}`).props.style);
  expect(view.getByLabelText(item.nameKo)).toBeOnTheScreen();
  expect(style.left).toBeGreaterThanOrEqual(0);expect(style.top).toBeGreaterThanOrEqual(0);
  expect(style.left+style.width).toBeLessThanOrEqual(width);expect(style.top+style.height).toBeLessThanOrEqual(width);
  await view.unmount();
 }
});
it.each([320,1280])('orders ground, animals, furniture and controls by foot position at %i',async width=>{
 const view=await render(<RoomScene animals={animals} members={members} isActive={false} selectedAnimalId={null} roomItems={[{slotId:'floor-rug',itemId:'rug-soft-oval',name:'러그'},{slotId:'center-table',itemId:'table-round-cookie',name:'탁자'},{slotId:'bed-corner',itemId:'bed-moon-headboard',name:'침대'}]} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()}/>);
 await fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'),'layout',{nativeEvent:{layout:{width,height:width}}});
 const depth=(id:string)=>ReactNative.StyleSheet.flatten(view.getByTestId(id).props.style).zIndex;
 expect(depth('placed-room-floor-rug')).toBeLessThan(depth('animal-sprite-a1'));
 expect(depth('placed-room-center-table')).toBeGreaterThan(depth('animal-sprite-a1'));
 expect(depth('placed-room-center-table')).toBeLessThan(depth('animal-sprite-a4'));
 expect(depth('placed-room-bed-corner')).toBeGreaterThan(depth('animal-sprite-a4'));
 expect(ReactNative.StyleSheet.flatten(view.getByLabelText('다온이 동물 선택').props.style).zIndex).toBeGreaterThan(depth('placed-room-bed-corner'));
});
it('keeps memory duplicates singular and parent-clipped touch targets at least 44pt',async()=>{
 const open=jest.fn();const view=await render(<RoomScene animals={[]} members={[]} isActive={false} selectedAnimalId={null} memoryFurniture={{itemId:'memory-radio-picnic-radio',name:'소풍 라디오',memoryId:'radio'}} roomItems={[{slotId:'memory-shelf',itemId:'memory-radio-picnic-radio',name:'소풍 라디오',memoryId:'radio'},{slotId:'memory-wall',itemId:'memory-frame-ribbon-frame',name:'리본 액자',memoryId:'frame'}]} onOpenMemory={open} onSelectAnimal={jest.fn()}/>);
 await fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'),'layout',{nativeEvent:{layout:{width:280,height:280}}});
 expect(view.getAllByLabelText('소풍 라디오 추억 열기')).toHaveLength(1);
 for(const id of ['memory-furniture','placed-room-memory-wall']){
  const node=view.getByTestId(id);const style=ReactNative.StyleSheet.flatten(node.props.style);const h=node.props.hitSlop;
  expect(Math.min(280,style.left+style.width+h.right)-Math.max(0,style.left-h.left)).toBeGreaterThanOrEqual(44);
  expect(Math.min(280,style.top+style.height+h.bottom)-Math.max(0,style.top-h.top)).toBeGreaterThanOrEqual(44);
 }
 await fireEvent.press(view.getByLabelText('리본 액자 추억 열기'));expect(open).toHaveBeenCalledWith('frame');
});

it('caps a desktop room to the width remaining beside the inventory panel',async()=>{
 jest.spyOn(ReactNative,'useWindowDimensions').mockReturnValue({fontScale:1,height:900,scale:1,width:1280});
 const view=await render(<RoomScene availableWidth={280} animals={[]} members={[]} isActive={false} selectedAnimalId={null} onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()}/>);
 expect(ReactNative.StyleSheet.flatten(view.getByLabelText('네 동물이 함께 지내는 방').props.style)).toEqual(expect.objectContaining({width:280,height:280}));
});

it.each([320, 1280])('keeps valid memory hit areas separate from every companion at %i', async width => {
  const memories = ITEM_CATALOG.filter(item => item.source === 'memory');
  expect(memories.length).toBeGreaterThan(0);
  for (const count of [1, 2, 3, 4]) {
    for (const item of memories) for (const slotId of item.allowedSlotIds) {
      const view = await render(<RoomScene animals={animals.slice(0, count)} members={members} isActive selectedAnimalId={null}
        roomItems={[{ slotId, itemId: item.id, name: item.nameKo, memoryId: 'readable-memory' }]}
        onOpenMemory={jest.fn()} onSelectAnimal={jest.fn()} />);
      await fireEvent(view.getByLabelText('네 동물이 함께 지내는 방'), 'layout', { nativeEvent: { layout: { width, height: width } } });
      const node = view.getByTestId(`placed-room-${slotId}`);
      const style = ReactNative.StyleSheet.flatten(node.props.style);
      const slop = node.props.hitSlop;
      const rect = { left: Math.max(0, style.left - slop.left), right: Math.min(width, style.left + style.width + slop.right),
        top: Math.max(0, style.top - slop.top), bottom: Math.min(width, style.top + style.height + slop.bottom) };
      for (const animal of animals.slice(0, count)) {
        const target = ReactNative.StyleSheet.flatten(view.getByLabelText(`${animal.name} 동물 선택`).props.style);
        const overlapWidth = Math.max(0, Math.min(rect.right, target.left + target.width) - Math.max(rect.left, target.left));
        const overlapHeight = Math.max(0, Math.min(rect.bottom, target.top + target.height) - Math.max(rect.top, target.top));
        expect(overlapWidth * overlapHeight).toBe(0);
      }
      await view.unmount();
    }
  }
});
