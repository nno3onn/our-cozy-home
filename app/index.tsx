import { StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        우리집
      </Text>
      <Text style={styles.body}>친구들과 함께 살 작은 방을 준비하고 있어요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#FFF8E8',
  },
  title: {
    color: '#38332E',
    fontSize: 32,
    fontWeight: '700',
  },
  body: {
    color: '#5E574F',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
