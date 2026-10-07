import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { validateOnboarding } from '@/auth/onboardingValidation';
import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import type { AnimalSpecies } from '@/domain/models';
import { colors, radii, spacing } from '@/theme/tokens';

const species: { id: AnimalSpecies; label: string }[] = [
  { id: 'rabbit', label: '토끼' },
  { id: 'bear', label: '곰' },
  { id: 'cat', label: '고양이' },
  { id: 'dog', label: '강아지' },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [animalName, setAnimalName] = useState('');
  const [pointColor, setPointColor] = useState('#F2A98C');
  const [selected, setSelected] = useState<AnimalSpecies>('rabbit');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const validation = validateOnboarding({ displayName, animalName, pointColor });
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    const message = await completeOnboarding({
      displayName: displayName.trim(),
      animalName: animalName.trim(),
      pointColor,
      species: selected,
    });
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    router.replace('/house/choose');
  }

  return (
    <ResponsiveFormPage testID="onboarding-page">
      <AppPageHeader backHref="/auth/sign-in" title="우리집 친구 만들기" />
      <AppText tone="secondary">내 동물을 만들고 친구들이 알아볼 정보를 정해요.</AppText>

      <AppSection title="이름">
        <AppInput label="내 이름" onChangeText={setDisplayName} placeholder="친구들에게 보일 이름" value={displayName} />
        <AppInput label="동물 이름" onChangeText={setAnimalName} placeholder="동물의 이름" value={animalName} />
      </AppSection>

      <AppSection description="같은 종류를 골라도 이름과 포인트 색으로 구별돼요." title="동물 종류">
        <View style={styles.speciesRow}>
          {species.map((item) => (
            <View key={item.id} style={styles.speciesButton}>
              <AppButton
                label={item.label}
                onPress={() => setSelected(item.id)}
                selected={selected === item.id}
                tone="quiet"
              />
            </View>
          ))}
        </View>
      </AppSection>

      <AppSection description="이름표와 내 가구를 구별하는 색이에요." title="포인트 색상">
        <View style={styles.colorRow}>
          <View accessibilityLabel={`선택한 색상 ${pointColor}`} style={[styles.colorSwatch, { backgroundColor: pointColor }]} />
          <View style={styles.colorInput}>
            <AppInput
              autoCapitalize="characters"
              label="색상 코드"
              maxLength={7}
              onChangeText={setPointColor}
              placeholder="#F2A98C"
              value={pointColor}
            />
          </View>
        </View>
      </AppSection>

      {error ? <InlineNotice message={error} tone="danger" /> : null}
      <AppButton disabled={saving} label={saving ? '저장 중…' : '완료'} onPress={() => void save()} />
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  speciesButton: { minWidth: 96, flexGrow: 1 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  colorSwatch: { width: 56, height: 56, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  colorInput: { minWidth: 0, flex: 1 },
});
