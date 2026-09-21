import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';
export default function SignUpScreen() { const { signUp }=useAuth(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState<string|null>(null); const [submitting,setSubmitting]=useState(false); async function submit(){setSubmitting(true);setError(null);const message=await signUp(email.trim(),password);setSubmitting(false);if(message)setError(message);else router.replace('/auth/sign-in');} return <SafeAreaView style={s.safe}><View style={s.content}><AppText variant="title">우리집 만들기</AppText><AppText tone="muted">이메일 인증 후 친구를 초대할 수 있어요.</AppText><TextInput accessibilityLabel="이메일" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="이메일" style={s.input} value={email}/><TextInput accessibilityLabel="비밀번호" autoComplete="new-password" onChangeText={setPassword} placeholder="비밀번호 (6자 이상)" secureTextEntry style={s.input} value={password}/>{error?<AppText tone="danger">{error}</AppText>:null}<AppButton disabled={submitting||!email||password.length<6} label={submitting?'가입 중…':'회원가입'} onPress={submit}/><Link href="/auth/sign-in"><AppText variant="label">이미 계정이 있어요</AppText></Link></View></SafeAreaView>; }
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},content:{flex:1,justifyContent:'center',padding:spacing.xl,gap:spacing.md},input:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:12,backgroundColor:colors.paper,color:colors.ink}});
