import { Image, StyleSheet, View } from 'react-native';

import { getIllustratedAsset } from './assetManifest';

export function RoomBackdrop() {
  const sunnyRoom = getIllustratedAsset('illustrated:room:sunny');

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {sunnyRoom?.source ? <Image resizeMode="cover" source={sunnyRoom.source} style={styles.image} testID="room-backdrop-image" /> : null}
      <View style={styles.warmth} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { position: 'absolute', inset: 0, height: '100%', width: '100%' },
  warmth: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255, 244, 227, 0.05)' },
});
