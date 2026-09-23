import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { validateOnboarding } from '@/auth/onboardingValidation';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type { AnimalSpecies } from '@/domain/models';
import { colors, spacing } from '@/theme/tokens';

const species: { id: AnimalSpecies; label: string }[] = [{ id: 'rabbit', label: '토끼' }, { id: 'bear', label: '곰' }, { id: 'cat', label: '고양이' }];
export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth(); const [displayName,setDisplayName]=useState(''); const [animalName,setAnimalName]=useState(''); const [pointColor,setPointColor]=useState('#F2A98C'); const [selected,setSelected]=useState<AnimalSpecies>('rabbit'); const [error,setError]=useState<string|null>(null); const [saving,setSaving]=useState(false);
  async function save(){ const validation=validateOnboarding({displayName,animalName,pointColor}); if(validation){setError(validation);return;} setSaving(true); const message=await completeOnboarding({displayName:displayName.trim(),animalName:animalName.trim(),pointColor,species:selected}); setSaving(false); if(message){setError(message);return;} router.replace('/house/create'); }
  return <SafeAreaView style={s.safe}><View style={s.content}><AppText variant="title">우리집 친구 만들기</AppText><AppText tone="muted">같은 동물 종도 친구마다 고를 수 있어요.</AppText><TextInput accessibilityLabel="표시 이름" value={displayName} onChangeText={setDisplayName} placeholder="내 이름" style={s.input}/><TextInput accessibilityLabel="동물 이름" value={animalName} onChangeText={setAnimalName} placeholder="동물 이름" style={s.input}/><View style={s.row}>{species.map((item)=><Pressable key={item.id} accessibilityLabel={item.label} onPress={()=>setSelected(item.id)} style={[s.choice,selected===item.id&&s.selected]}><AppText variant="label">{item.label}</AppText></Pressable>)}</View><TextInput accessibilityLabel="포인트 색상" value={pointColor} onChangeText={setPointColor} placeholder="#F2A98C" style={s.input}/>{error?<AppText tone="danger">{error}</AppText>:null}<AppButton disabled={saving} label={saving?'저장 중…':'완료'} onPress={save}/></View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},content:{flex:1,justifyContent:'center',padding:spacing.xl,gap:spacing.md},input:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:12,backgroundColor:colors.paper,color:colors.ink},row:{flexDirection:'row',gap:spacing.sm},choice:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line,borderRadius:12},selected:{backgroundColor:colors.mint,borderColor:colors.ink}});
