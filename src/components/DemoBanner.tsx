import { StyleSheet, Text, View } from 'react-native';

export function DemoBanner() {
  return (
    <View
      accessibilityLabel="현재 데모 모드입니다"
      style={styles.container}
    >
      <Text style={styles.text}>데모 모드</Text>
      <Text style={styles.detail}>변경 내용은 앱을 다시 열면 초기화될 수 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: '#91C9AF',
  },
  text: {
    color: '#243C31',
    fontSize: 13,
    fontWeight: '700',
  },
  detail: {
    color: '#365849',
    fontSize: 11,
  },
});
