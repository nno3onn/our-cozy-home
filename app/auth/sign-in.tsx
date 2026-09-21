import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
  async function submit() { setSubmitting(true); setError(null); const message = await signIn(email.trim(), password); setSubmitting(false); if (message) setError(message); else router.replace('/'); }
  return <SafeAreaView style={styles.safe}><View style={styles.content}><AppText variant="title">우리집에 돌아왔어요</AppText><AppText tone="muted">친구와 함께 살던 집으로 들어가요.</AppText><TextInput accessibilityLabel="이메일" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="이메일" style={styles.input} value={email} /><TextInput accessibilityLabel="비밀번호" autoComplete="password" onChangeText={setPassword} placeholder="비밀번호" secureTextEntry style={styles.input} value={password} />{error ? <AppText tone="danger">{error}</AppText> : null}<AppButton disabled={submitting || !email || !password} label={submitting ? '로그인 중…' : '로그인'} onPress={submit} /><Link href="/auth/sign-up"><AppText variant="label">처음이라면 회원가입</AppText></Link></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.cream},content:{flex:1,justifyContent:'center',padding:spacing.xl,gap:spacing.md},input:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:12,backgroundColor:colors.paper,color:colors.ink} });
