import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Animal, Member } from '@/domain/models';
import { sortRoomActors } from '@/game/room/layers';
import { getAnimalAnchors, toViewport } from '@/game/room/roomLayout';
import { illustratedColors, illustratedRadii } from '@/theme/illustratedTokens';

import { AnimalActor } from '@/features/room/components/AnimalActor';
import { AppText } from '@/components/ui/AppText';

import { AnimalSprite } from './AnimalSprite';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomBackdrop } from './RoomBackdrop';

type Props = {
  animals: Animal[];
  members: Member[];
  selectedAnimalId: string | null;
  isActive: boolean;
  memoryFurniture?: { name: string; memoryId: string };
  accentFurniture?: { name: string; color: string; itemId?: string };
  onOpenMemory: (memoryId: string) => void;
  onSelectAnimal: (animalId: string) => void;
};

export function RoomScene({ animals, accentFurniture, isActive, members, memoryFurniture, onOpenMemory, onSelectAnimal, selectedAnimalId }: Props) {
  const window = useWindowDimensions();
  const [viewport, setViewport] = useState({ width: 320, height: 320 });
  const desktopSceneSize = window.width >= 900 ? Math.min(720, Math.max(360, window.height - 190)) : undefined;
  const anchors = getAnimalAnchors(Math.min(Math.max(animals.length, 1), 4) as 1 | 2 | 3 | 4);
  const actors = sortRoomActors(animals.map((animal, index) => ({ animal, anchor: anchors[index], id: animal.id, footY: anchors[index].foot.y })));
  const scale = Math.min(viewport.width, viewport.height) / 1000;
  const memory = toViewport({ x: 104, y: 390 }, viewport);

  return (
    <View
      accessibilityLabel="네 동물이 함께 지내는 방"
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      style={[styles.room, desktopSceneSize ? { aspectRatio: undefined, height: desktopSceneSize, width: desktopSceneSize } : undefined]}
    >
      <RoomBackdrop />
      <View pointerEvents="none" style={[styles.rug, { left: 190 * scale, top: 685 * scale, width: 620 * scale, height: 180 * scale }]} />
      <View style={[styles.furniture, { left: 365 * scale, top: 475 * scale, width: 280 * scale, height: 230 * scale }]}>
        {accentFurniture?.itemId ? <FurnitureSprite itemId={accentFurniture.itemId} /> : <View style={[styles.placeholderTable, { backgroundColor: accentFurniture?.color ?? illustratedColors.peach }]} />}
      </View>
      <View pointerEvents="none" style={[styles.plant, { left: 780 * scale, top: 335 * scale, width: 180 * scale, height: 270 * scale }]}>
        <FurnitureSprite itemId="plant-round-rubber-tree" />
      </View>
      {memoryFurniture ? (
        <Pressable accessibilityLabel={`${memoryFurniture.name} 추억 열기`} accessibilityRole="button" onPress={() => onOpenMemory(memoryFurniture.memoryId)} style={[styles.memory, { left: memory.x, top: memory.y, width: Math.max(58, 175 * scale), height: Math.max(58, 148 * scale) }]}>
          <AppText variant="heading">▣</AppText>
          <AppText numberOfLines={1} variant="caption">추억</AppText>
        </Pressable>
      ) : null}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        return member ? <AnimalSprite animal={animal} anchor={anchor} key={`sprite-${animal.id}`} member={member} viewport={viewport} /> : null;
      })}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        return member ? <AnimalActor anchor={anchor} animal={animal} isActive={isActive} key={animal.id} member={member} onPress={() => onSelectAnimal(animal.id)} selected={selectedAnimalId === animal.id} viewport={viewport} /> : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  room: { width: '100%', maxWidth: 720, alignSelf: 'center', aspectRatio: 1, overflow: 'hidden', borderRadius: illustratedRadii.room, borderWidth: 2, borderColor: illustratedColors.line, backgroundColor: illustratedColors.wall },
  rug: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255, 246, 226, 0.74)', borderWidth: 2, borderColor: 'rgba(158, 111, 76, 0.18)' },
  furniture: { position: 'absolute' },
  placeholderTable: { width: '74%', height: '56%', alignSelf: 'center', marginTop: '22%', borderRadius: 48, borderWidth: 2, borderColor: illustratedColors.cocoa },
  plant: { position: 'absolute' },
  memory: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 2, borderColor: illustratedColors.cocoa, backgroundColor: 'rgba(255, 253, 248, 0.92)' },
});
