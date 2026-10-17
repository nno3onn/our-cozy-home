import { useState } from 'react';
import * as ReactNative from 'react-native';

import type { Animal, Member } from '@/domain/models';
import { placedItemLayout, type PlacedRoomItem } from '@/game/room/placedItems';
import { getRoomItemDepth } from '@/game/room/sceneDepth';
import { sortRoomActors } from '@/game/room/layers';
import { getAnimalAnchors, toViewport } from '@/game/room/roomLayout';
import { illustratedColors, illustratedRadii } from '@/theme/illustratedTokens';
import { getResponsiveLayout } from '@/theme/responsive';

import { AnimalActor } from '@/features/room/components/AnimalActor';
import { AnimalSprite } from './AnimalSprite';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomBackdrop } from './RoomBackdrop';

type Props = {
  roomItems?: PlacedRoomItem[];
  availableWidth?: number;
  animals: Animal[];
  members: Member[];
  selectedAnimalId: string | null;
  isActive: boolean;
  memoryFurniture?: { itemId: string; name: string; memoryId: string };
  accentFurniture?: { name: string; color: string; itemId?: string };
  onOpenMemory: (memoryId: string) => void;
  onSelectAnimal: (animalId: string) => void;
};

function getFurnitureHitSlop(
  artwork: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
) {
  // A parent clips hitSlop. Allocate any missing reach on the other side.
  function axis(start: number, size: number, total: number) {
    const padding = Math.max(8, Math.ceil((44 - size) / 2));
    const beforeSpace = Math.max(0, start);
    const afterSpace = Math.max(0, total - start - size);
    let before = Math.min(beforeSpace, padding);
    const after = Math.min(afterSpace, Math.max(padding, Math.ceil(44 - size - before)));
    before = Math.min(beforeSpace, Math.max(before, Math.ceil(44 - size - after)));
    return { before, after };
  }
  const horizontal = axis(artwork.left, artwork.width, viewport.width);
  const vertical = axis(artwork.top, artwork.height, viewport.height);
  return { top: vertical.before, bottom: vertical.after, left: horizontal.before, right: horizontal.after };
}

export function RoomScene({ roomItems = [], availableWidth, animals, accentFurniture, isActive, members, memoryFurniture, onOpenMemory, onSelectAnimal, selectedAnimalId }: Props) {
  const window = ReactNative.useWindowDimensions();
  const [viewport, setViewport] = useState({ width: 320, height: 320 });
  const desktopSceneSize = getResponsiveLayout(window.width).breakpoint === 'wide'
    ? Math.min(720, Math.max(360, window.height - 190), availableWidth && availableWidth > 0 ? availableWidth : Infinity)
    : undefined;
  const anchors = getAnimalAnchors(Math.min(Math.max(animals.length, 1), 4) as 1 | 2 | 3 | 4);
  const actors = sortRoomActors(animals.map((animal, index) => ({ animal, anchor: anchors[index], id: animal.id, footY: anchors[index].foot.y })));
  const scale = Math.min(viewport.width, viewport.height) / 1000;
  const memoryArtScale = 1;
  const memory = toViewport({ x: 20, y: 390 }, viewport);
  const accent = toViewport({ x: 365, y: 475 }, viewport);

  return (
    <ReactNative.View
      accessibilityLabel="네 동물이 함께 지내는 방"
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      style={[styles.room, desktopSceneSize ? { aspectRatio: undefined, height: desktopSceneSize, width: desktopSceneSize } : undefined]}
    >
      <RoomBackdrop />
      {roomItems.filter(item => !(item.slotId === 'floor-accent-left' && accentFurniture) && !(item.slotId === 'memory-shelf' && memoryFurniture)).map(item => {
        const layout = placedItemLayout[item.slotId];
        if (!layout) return null;
        const foot = toViewport(layout, viewport);
        const zIndex = getRoomItemDepth(item.slotId, item.slotId === 'memory-shelf' ? memory.y + 148 * scale * memoryArtScale : foot.y);
        const style = item.slotId === 'memory-shelf' ? { position: 'absolute' as const, zIndex, left: memory.x, top: memory.y, width: 175 * scale * memoryArtScale, height: 148 * scale * memoryArtScale } : { position: 'absolute' as const, zIndex, left: foot.x - layout.width * scale / 2, top: foot.y - layout.height * scale, width: layout.width * scale, height: layout.height * scale };
        const artwork = <FurnitureSprite itemId={item.itemId} />;
        return item.memoryId ? <ReactNative.Pressable key={item.slotId} style={style} hitSlop={getFurnitureHitSlop(style, viewport)} accessibilityRole="button" accessibilityLabel={`${item.name} 추억 열기`} onPress={() => onOpenMemory(item.memoryId!)} testID={`placed-room-${item.slotId}`}>{artwork}</ReactNative.Pressable>
          : <ReactNative.View key={item.slotId} style={style} pointerEvents="none" testID={`placed-room-${item.slotId}`}>{artwork}</ReactNative.View>;
      })}
      {accentFurniture ? <ReactNative.View style={[styles.furniture, { left: accent.x, top: accent.y, width: 280 * scale, height: 230 * scale, zIndex: getRoomItemDepth('floor-accent-left', accent.y + 230 * scale) }]}>
        {accentFurniture.itemId ? <FurnitureSprite itemId={accentFurniture.itemId} /> : <ReactNative.View style={[styles.placeholderTable, { backgroundColor: accentFurniture.color }]} />}
      </ReactNative.View> : null}
      {memoryFurniture ? (
        <ReactNative.Pressable accessibilityLabel={`${memoryFurniture.name} 추억 열기`} accessibilityRole="button" hitSlop={getFurnitureHitSlop({ left: memory.x, top: memory.y, width: 175 * scale * memoryArtScale, height: 148 * scale * memoryArtScale }, viewport)} onPress={() => onOpenMemory(memoryFurniture.memoryId)} style={[styles.memory, { left: memory.x, top: memory.y, width: 175 * scale * memoryArtScale, height: 148 * scale * memoryArtScale, zIndex: getRoomItemDepth('memory-shelf', memory.y + 148 * scale * memoryArtScale) }]} testID="memory-furniture">
          <FurnitureSprite itemId={memoryFurniture.itemId} />
        </ReactNative.Pressable>
      ) : null}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        return member ? <AnimalSprite animal={animal} anchor={anchor} key={`sprite-${animal.id}`} member={member} viewport={viewport} /> : null;
      })}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        return member ? <AnimalActor anchor={anchor} animal={animal} isActive={isActive} key={animal.id} member={member} onPress={() => onSelectAnimal(animal.id)} selected={selectedAnimalId === animal.id} viewport={viewport} /> : null;
      })}
    </ReactNative.View>
  );
}

const styles = ReactNative.StyleSheet.create({
  room: { width: '100%', maxWidth: 720, alignSelf: 'center', aspectRatio: 1, overflow: 'hidden', borderRadius: illustratedRadii.room, borderWidth: 2, borderColor: illustratedColors.line, backgroundColor: illustratedColors.wall },
  furniture: { position: 'absolute' },
  placeholderTable: { width: '74%', height: '56%', alignSelf: 'center', marginTop: '22%', borderRadius: 48, borderWidth: 2, borderColor: illustratedColors.cocoa },
  memory: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
