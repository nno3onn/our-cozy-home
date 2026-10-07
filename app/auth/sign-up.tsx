import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { spacing } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const message = await signUp(email.trim(), password);
    setSubmitting(false);
    if (message) setError(message);
    else router.replace('/auth/sign-in');
  }

  return (
    <ResponsiveFormPage testID="sign-up-page">
      <AppPageHeader backHref="/auth/sign-in" title="회원가입" />
      <View style={styles.intro}>
        <AppText variant="display">나만의 우리집을 시작해요</AppText>
        <AppText tone="secondary">이메일 인증을 마치면 친구를 초대할 수 있어요.</AppText>
      </View>
      <View style={styles.form}>
        <AppInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="이메일"
          onChangeText={setEmail}
          placeholder="name@example.com"
          value={email}
        />
        <AppInput
          autoComplete="new-password"
          helperText="영문과 숫자를 조합해 6자 이상 입력해 주세요."
          label="비밀번호"
          onChangeText={setPassword}
          placeholder="6자 이상 입력"
          secureTextEntry
          value={password}
        />
      </View>
      {error ? <InlineNotice message={error} tone="danger" /> : null}
      <AppButton
        disabled={submitting || !email || password.length < 6}
        label={submitting ? '가입 중…' : '회원가입'}
        onPress={submit}
      />
      <Link href="/auth/sign-in" style={styles.link}>
        <AppText tone="brand" variant="label">이미 계정이 있어요</AppText>
      </Link>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  form: { gap: spacing.lg },
  link: { alignSelf: 'center', padding: spacing.sm },
});
