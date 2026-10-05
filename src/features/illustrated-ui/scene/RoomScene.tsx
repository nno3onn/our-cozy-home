import { useState } from 'react';
import * as ReactNative from 'react-native';

import type { Animal, Member } from '@/domain/models';
import { sortRoomActors } from '@/game/room/layers';
import { getAnimalAnchors, toViewport } from '@/game/room/roomLayout';
import { illustratedColors, illustratedRadii } from '@/theme/illustratedTokens';
import { getResponsiveLayout } from '@/theme/responsive';

import { AnimalActor } from '@/features/room/components/AnimalActor';
import { AnimalSprite } from './AnimalSprite';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomBackdrop } from './RoomBackdrop';

type Props = {
  animals: Animal[];
  members: Member[];
  selectedAnimalId: string | null;
  isActive: boolean;
  memoryFurniture?: { itemId: string; name: string; memoryId: string };
  accentFurniture?: { name: string; color: string; itemId?: string };
  onOpenMemory: (memoryId: string) => void;
  onSelectAnimal: (animalId: string) => void;
};

export function RoomScene({ animals, accentFurniture, isActive, members, memoryFurniture, onOpenMemory, onSelectAnimal, selectedAnimalId }: Props) {
  const window = ReactNative.useWindowDimensions();
  const [viewport, setViewport] = useState({ width: 320, height: 320 });
  const desktopSceneSize = getResponsiveLayout(window.width).breakpoint === 'wide'
    ? Math.min(720, Math.max(360, window.height - 190))
    : undefined;
  const anchors = getAnimalAnchors(Math.min(Math.max(animals.length, 1), 4) as 1 | 2 | 3 | 4);
  const actors = sortRoomActors(animals.map((animal, index) => ({ animal, anchor: anchors[index], id: animal.id, footY: anchors[index].foot.y })));
  const scale = Math.min(viewport.width, viewport.height) / 1000;
  const memory = toViewport({ x: 20, y: 390 }, viewport);

  return (
    <ReactNative.View
      accessibilityLabel="네 동물이 함께 지내는 방"
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      style={[styles.room, desktopSceneSize ? { aspectRatio: undefined, height: desktopSceneSize, width: desktopSceneSize } : undefined]}
    >
      <RoomBackdrop />
      {accentFurniture ? <ReactNative.View style={[styles.furniture, { left: 365 * scale, top: 475 * scale, width: 280 * scale, height: 230 * scale }]}>
        {accentFurniture.itemId ? <FurnitureSprite itemId={accentFurniture.itemId} /> : <ReactNative.View style={[styles.placeholderTable, { backgroundColor: accentFurniture.color }]} />}
      </ReactNative.View> : null}
      {memoryFurniture ? (
        <ReactNative.Pressable accessibilityLabel={`${memoryFurniture.name} 추억 열기`} accessibilityRole="button" hitSlop={8} onPress={() => onOpenMemory(memoryFurniture.memoryId)} style={[styles.memory, { left: memory.x, top: memory.y, width: 175 * scale, height: 148 * scale }]} testID="memory-furniture">
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
