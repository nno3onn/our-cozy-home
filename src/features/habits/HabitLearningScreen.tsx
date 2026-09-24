import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, spacing } from '@/theme/tokens';

export function HabitLearningScreen() {
 const repository=useRepository(); const query=useQuery({queryKey:['habit-learning'],queryFn:()=>repository.listHabitLearning()});
 if(!query.data?.length)return <SafeAreaView style={styles.safe}><EmptyState title="진행 중인 버릇이 없어요" description="친구 동물을 골라 함께 활동하면 버릇을 배울 수 있어요."/></SafeAreaView>;
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><AppText variant="title">버릇 배우기</AppText>{query.data.map(item=><Panel key={item.id} style={styles.card}><AppText variant="heading">{item.habitName}</AppText><AppText tone="muted">선생님 동물과 함께 배우는 중이에요.</AppText><AppText>진행 {item.completedDays}/3일</AppText><AppText tone="muted">{item.status==='learned'?'배웠어요. 동물 행동에서 확인해 보세요.':'서로 다른 날에 함께 활동하면 진행돼요.'}</AppText></Panel>)}</ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},content:{padding:spacing.lg,gap:spacing.md},card:{padding:spacing.lg,gap:spacing.sm}});
