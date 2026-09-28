import { Image, StyleSheet, View } from 'react-native';

import { getIllustratedAsset } from './assetManifest';

export function RoomBackdrop() {
  const sunnyRoom = getIllustratedAsset('illustrated:room:sunny');

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {sunnyRoom?.source ? <Image resizeMode="cover" source={sunnyRoom.source} style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.warmth} />
    </View>
  );
}

const styles = StyleSheet.create({
  warmth: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 244, 227, 0.05)' },
});
