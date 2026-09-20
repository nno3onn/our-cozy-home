import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Animal, Member } from '@/domain/models';
import { getAnimalAnchors, toViewport } from '@/game/room/roomLayout';
import { sortRoomActors } from '@/game/room/layers';
import { colors } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';

import { AnimalActor } from './AnimalActor';

type RoomCanvasProps = {
  animals: Animal[];
  members: Member[];
  selectedAnimalId: string | null;
  isActive: boolean;
  memoryFurniture?: { name: string; memoryId: string };
  accentFurniture?: { name: string; color: string };
  onOpenMemory: (memoryId: string) => void;
  onSelectAnimal: (animalId: string) => void;
};

export function RoomCanvas({
  animals,
  accentFurniture,
  isActive,
  members,
  memoryFurniture,
  onOpenMemory,
  onSelectAnimal,
  selectedAnimalId,
}: RoomCanvasProps) {
  const [viewport, setViewport] = useState({ width: 320, height: 320 });
  const anchors = getAnimalAnchors(Math.min(Math.max(animals.length, 1), 4) as 1 | 2 | 3 | 4);
  const actors = sortRoomActors(
    animals.map((animal, index) => ({
      animal,
      anchor: anchors[index],
      id: animal.id,
      footY: anchors[index].foot.y,
    })),
  );
  const wallBottom = toViewport({ x: 0, y: 420 }, viewport).y;
  const scale = viewport.width / 1000;
  const memory = toViewport({ x: 90, y: 445 }, viewport);

  return (
    <View
      accessibilityLabel="네 동물이 함께 지내는 방"
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      style={styles.room}
    >
      <View style={[styles.wall, { height: wallBottom }]} />
      <View style={[styles.floor, { top: wallBottom }]} />
      <View style={[styles.rug, { left: 220 * scale, top: 690 * scale, width: 560 * scale, height: 138 * scale }]} />
      <View
        accessibilityLabel={accentFurniture ? `${accentFurniture.name} 배치됨` : undefined}
        style={[styles.table, { backgroundColor: accentFurniture?.color ?? colors.peach, left: 360 * scale, top: 545 * scale, width: 280 * scale, height: 195 * scale }]}
      />
      <View style={[styles.plantStem, { left: 850 * scale, top: 420 * scale, width: 32 * scale, height: 220 * scale }]} />
      <View style={[styles.plantLeaf, { left: 745 * scale, top: 330 * scale, width: 150 * scale, height: 150 * scale }]} />
      {memoryFurniture ? (
        <Pressable
          accessibilityLabel={`${memoryFurniture.name} 추억 열기`}
          accessibilityRole="button"
          onPress={() => onOpenMemory(memoryFurniture.memoryId)}
          style={[styles.memory, { left: memory.x, top: memory.y, width: 180 * scale, height: 160 * scale }]}
        >
          <AppText variant="heading">♪</AppText>
        </Pressable>
      ) : null}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        const foot = toViewport(anchor.foot, viewport);
        return (
          <View
            key={`shape-${animal.id}`}
            style={[
              styles.animalShape,
              {
                backgroundColor: member?.pointColor ?? colors.mutedInk,
                left: foot.x - 30 * scale,
                top: foot.y - 68 * scale,
                width: (animal.species === 'rabbit' ? 52 : animal.species === 'cat' ? 66 : 60) * scale,
                height: (animal.species === 'rabbit' ? 72 : animal.species === 'cat' ? 54 : 60) * scale,
              },
            ]}
          />
        );
      })}
      {actors.map(({ animal, anchor }) => {
        const member = members.find((candidate) => candidate.userId === animal.ownerId);
        if (!member) return null;
        return (
          <AnimalActor
            anchor={anchor}
            animal={animal}
            isActive={isActive}
            key={animal.id}
            member={member}
            onPress={() => onSelectAnimal(animal.id)}
            selected={selectedAnimalId === animal.id}
            viewport={viewport}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  room: { width: '100%', maxWidth: 720, alignSelf: 'center', aspectRatio: 1, overflow: 'hidden', borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.cream },
  wall: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: colors.cream },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.floor },
  rug: { position: 'absolute', borderRadius: 999, backgroundColor: '#D4BE9A' },
  table: { position: 'absolute', borderRadius: 18, backgroundColor: colors.peach },
  plantStem: { position: 'absolute', backgroundColor: '#72977A' },
  plantLeaf: { position: 'absolute', borderRadius: 999, backgroundColor: colors.mint },
  memory: { position: 'absolute', alignItems: 'center', justifyContent: 'center', minWidth: 56, minHeight: 56, borderRadius: 12, backgroundColor: colors.lilac, borderWidth: 2, borderColor: colors.ink },
  animalShape: { position: 'absolute', borderRadius: 999, borderWidth: 2, borderColor: colors.ink },
});
