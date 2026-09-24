import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { MemoryComposerScreen } from '@/features/memories/screens/MemoryComposerScreen';
import { useHomeSnapshot, homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { memoriesKey } from '@/features/memories/hooks/useMemories';
import { useRepository } from '@/repositories/RepositoryContext';
export default function MemoryCreateRoute() { const repository=useRepository(); const queryClient=useQueryClient(); const home=useHomeSnapshot(); const createDraft=useMutation({mutationFn:repository.createMemoryDraft.bind(repository)}); const shareDraft=useMutation({mutationFn:repository.shareMemoryDraft.bind(repository),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:memoriesKey});await queryClient.invalidateQueries({queryKey:homeSnapshotKey});}}); if(!home.data)return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator accessibilityLabel="집 구성원 불러오는 중"/></View>; return <MemoryComposerScreen members={home.data.members} onSaveDraft={createDraft.mutateAsync} onShareDraft={async id=>{const result=await shareDraft.mutateAsync(id);router.replace('/(tabs)/memories');return result;}}/>; }
