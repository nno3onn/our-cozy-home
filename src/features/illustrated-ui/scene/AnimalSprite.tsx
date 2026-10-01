import { Image, StyleSheet, View } from 'react-native';

import type { Animal, Member } from '@/domain/models';
import type { AnimalAnchor, Viewport } from '@/game/room/roomLayout';
import { toViewport } from '@/game/room/roomLayout';

import { getIllustratedAsset } from './assetManifest';

type Props = { animal: Animal; anchor: AnimalAnchor; member: Member; viewport: Viewport };

export function AnimalSprite({ animal, anchor, member, viewport }: Props) {
  const foot = toViewport(anchor.foot, viewport);
  const scale = Math.min(viewport.width, viewport.height) / 1000;
  const size = Math.max(82, 220 * scale);
  const key = animal.species === 'rabbit'
    ? 'illustrated:animal:rabbit'
    : animal.species === 'cat'
      ? 'illustrated:animal:cat'
      : animal.species === 'bear'
        ? 'illustrated:animal:bear'
        : animal.species === 'dog'
          ? 'illustrated:animal:dog'
        : 'illustrated:placeholder:animal';
  const asset = getIllustratedAsset(key);

  return (
    <View pointerEvents="none" style={[styles.sprite, { left: foot.x - size / 2, top: foot.y - size * 0.94, width: size, height: size }]}>
      {asset?.source ? <Image resizeMode="contain" source={asset.source} style={styles.image} /> : <View style={[styles.bearFallback, { backgroundColor: member.pointColor }]} />}
      <View style={[styles.ownerRibbon, { backgroundColor: member.pointColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  image: { width: '100%', height: '100%' },
  bearFallback: { width: '54%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: '#4B372B' },
  ownerRibbon: { position: 'absolute', bottom: 7, width: '42%', height: 6, borderRadius: 999, opacity: 0.9 },
});
