import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import type { RuntimeConfig } from '@/config/env';

type RuntimeError = Extract<RuntimeConfig, { ok: false }>['reason'];

const descriptions: Record<RuntimeError, string> = {
  missing_app_mode:
    '실행 모드가 비어 있어요. 데모를 보려면 EXPO_PUBLIC_APP_MODE=demo로 실행해 주세요.',
  invalid_app_mode:
    '실행 모드는 demo 또는 supabase만 사용할 수 있어요. 환경 변수 값을 확인해 주세요.',
  missing_supabase_environment:
    'Supabase 주소와 publishable key가 필요해요. .env 설정을 확인해 주세요.',
  supabase_repository_unavailable:
    'Supabase 데이터 연결은 다음 구현 단계에서 활성화돼요. 지금은 데모 모드를 명시해서 확인해 주세요.',
};

export function ModeErrorScreen({ reason }: { reason: RuntimeError }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>
          설정 확인
        </Text>
        <Text style={styles.description}>{descriptions[reason]}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF8E8',
  },
  panel: {
    gap: 12,
    paddingVertical: 24,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#38332E',
  },
  title: {
    color: '#38332E',
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#5E574F',
    fontSize: 16,
    lineHeight: 24,
  },
});
