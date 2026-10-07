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

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setSubmitting(false);
    if (message) setError(message);
    else router.replace('/');
  }

  return (
    <ResponsiveFormPage testID="sign-in-page">
      <AppPageHeader backHref="/" title="로그인" />
      <View style={styles.intro}>
        <AppText variant="display">우리집에 돌아왔어요</AppText>
        <AppText tone="secondary">친구와 동물이 기다리는 집으로 들어가요.</AppText>
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
          autoComplete="password"
          label="비밀번호"
          onChangeText={setPassword}
          placeholder="비밀번호를 입력해 주세요"
          secureTextEntry
          value={password}
        />
      </View>
      {error ? <InlineNotice message={error} tone="danger" /> : null}
      <AppButton
        disabled={submitting || !email || !password}
        label={submitting ? '로그인 중…' : '로그인'}
        onPress={submit}
      />
      <Link href="/auth/sign-up" style={styles.link}>
        <AppText tone="brand" variant="label">처음이라면 회원가입</AppText>
      </Link>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  form: { gap: spacing.lg },
  link: { alignSelf: 'center', padding: spacing.sm },
});
