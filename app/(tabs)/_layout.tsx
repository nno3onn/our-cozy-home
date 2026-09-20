import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mutedInk,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '우리집' }} />
      <Tabs.Screen name="decorate" options={{ title: '꾸미기' }} />
      <Tabs.Screen name="memories" options={{ title: '추억' }} />
    </Tabs>
  );
}
