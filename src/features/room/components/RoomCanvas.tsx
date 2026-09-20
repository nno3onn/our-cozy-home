import { Canvas, Circle, Rect, RoundedRect } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Animal, Member } from '@/domain/models';
import { getAnimalAnchors, toViewport } from '@/game/room/roomLayout';
import { sortRoomActors } from '@/game/room/layers';
import { colors } from '@/theme/tokens';

import { AnimalActor } from './AnimalActor';
import { AppText } from '@/components/ui/AppText';

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
  memoryFurniture,
  onOpenMemory,
  members,
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
  const rugTopLeft = toViewport({ x: 220, y: 690 }, viewport);
  const rugBottomRight = toViewport({ x: 780, y: 828 }, viewport);
  const tableTopLeft = toViewport({ x: 360, y: 545 }, viewport);
  const tableBottomRight = toViewport({ x: 640, y: 740 }, viewport);
  const plantStemTopLeft = toViewport({ x: 850, y: 420 }, viewport);
  const plantStemBottomRight = toViewport({ x: 882, y: 640 }, viewport);
  const plantLeft = toViewport({ x: 820, y: 410 }, viewport);
  const plantRight = toViewport({ x: 900, y: 395 }, viewport);
  const scale = viewport.width / 1000;
  const memoryTopLeft = toViewport({ x: 90, y: 445 }, viewport);
  const memoryBottomRight = toViewport({ x: 270, y: 605 }, viewport);

  return (
    <View
      accessibilityLabel="네 동물이 함께 지내는 방"
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      style={styles.room}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect color={colors.cream} height={wallBottom} width={viewport.width} x={0} y={0} />
        <Rect
          color={colors.floor}
          height={viewport.height - wallBottom}
          width={viewport.width}
          x={0}
          y={wallBottom}
        />
        <RoundedRect
          color="#D4BE9A"
          height={rugBottomRight.y - rugTopLeft.y}
          r={68 * scale}
          width={rugBottomRight.x - rugTopLeft.x}
          x={rugTopLeft.x}
          y={rugTopLeft.y}
        />
        <RoundedRect
          color={accentFurniture?.color ?? colors.peach}
          height={tableBottomRight.y - tableTopLeft.y}
          r={42 * scale}
          width={tableBottomRight.x - tableTopLeft.x}
          x={tableTopLeft.x}
          y={tableTopLeft.y}
        />
        <Rect
          color="#72977A"
          height={plantStemBottomRight.y - plantStemTopLeft.y}
          width={plantStemBottomRight.x - plantStemTopLeft.x}
          x={plantStemTopLeft.x}
          y={plantStemTopLeft.y}
        />
        <Circle color={colors.mint} cx={plantLeft.x} cy={plantLeft.y} r={75 * scale} />
        <Circle color="#78B995" cx={plantRight.x} cy={plantRight.y} r={62 * scale} />
        {memoryFurniture ? (
          <RoundedRect
            color={colors.lilac}
            height={memoryBottomRight.y - memoryTopLeft.y}
            r={28 * scale}
            width={memoryBottomRight.x - memoryTopLeft.x}
            x={memoryTopLeft.x}
            y={memoryTopLeft.y}
          />
        ) : null}
        {actors.map(({ animal, anchor }) => {
          const foot = toViewport(anchor.foot, viewport);
          const member = members.find((candidate) => candidate.userId === animal.ownerId);
          const bodyColor = member?.pointColor ?? colors.mutedInk;
          return (
            <Circle
              color={bodyColor}
              cx={foot.x}
              cy={foot.y - 38}
              key={animal.id}
              r={30}
            />
          );
        })}
      </Canvas>
      {memoryFurniture ? (
        <Pressable
          accessibilityLabel={`${memoryFurniture.name} 추억 열기`}
          accessibilityRole="button"
          onPress={() => onOpenMemory(memoryFurniture.memoryId)}
          style={[
            styles.memoryTarget,
            {
              left: memoryTopLeft.x,
              top: memoryTopLeft.y,
              width: Math.max(memoryBottomRight.x - memoryTopLeft.x, 56),
              height: Math.max(memoryBottomRight.y - memoryTopLeft.y, 56),
            },
          ]}
        >
          <AppText variant="heading">♪</AppText>
        </Pressable>
      ) : null}
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
  room: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    aspectRatio: 1,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
  },
  memoryTarget: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
