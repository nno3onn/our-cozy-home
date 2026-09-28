import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '우리집' }} />
      <Tabs.Screen name="decorate" options={{ title: '꾸미기' }} />
      <Tabs.Screen name="memories" options={{ title: '추억' }} />
    </Tabs>
  );
}
