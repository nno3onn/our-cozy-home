import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateMemoryDraftInput, Member, MemoryShareResult } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';
import { selectAndPrepareMemoryPhoto, type PreparedMemoryPhoto } from '../photo/photoPicker';

export function MemoryComposerScreen({ members, onSaveDraft, onShareDraft, onUploadPhoto }: { members: Member[]; onSaveDraft(input: CreateMemoryDraftInput): Promise<{ id: string }>; onShareDraft(memoryId: string): Promise<MemoryShareResult>; onUploadPhoto?: (memoryId: string, photo: PreparedMemoryPhoto) => Promise<void> }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [draftId, setDraftId] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [photo, setPhoto] = useState<PreparedMemoryPhoto | null>(null);
  const save = async () => { if (!title.trim()) return setMessage('제목을 적어 주세요.'); setBusy(true); try { const draft = await onSaveDraft({ title: title.trim(), body, occurredOn: new Date().toISOString().slice(0, 10) }); setDraftId(draft.id); setMessage('초안으로 저장했어요. 공유하기를 눌러야 친구들에게 보여요.'); } finally { setBusy(false); } };
  const share = async () => { if (!draftId) return; setBusy(true); try { const result = await onShareDraft(draftId); if (photo && onUploadPhoto) await onUploadPhoto(draftId, photo); setMessage(`${result.viewerCount}명에게 공유했어요.`); } catch { setMessage('사진 업로드에 실패했어요. 글과 사진은 유지됐어요. 다시 시도해 주세요.'); } finally { setBusy(false); } };
  const pickPhoto = async () => { try { setPhoto(await selectAndPrepareMemoryPhoto()); } catch (error) { setMessage(error instanceof Error ? error.message : '사진을 준비하지 못했어요.'); } };
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}><AppText variant="title">새 추억 기록</AppText><AppText variant="label">현재 집 친구들에게 공유돼요</AppText><AppText tone="muted">{members.map((member) => member.displayName).join(' · ')}</AppText><TextInput accessibilityLabel="추억 제목" onChangeText={setTitle} placeholder="오늘의 제목" style={styles.input} value={title}/><TextInput accessibilityLabel="추억 글" multiline onChangeText={setBody} placeholder="함께한 순간을 적어 주세요" style={[styles.input, styles.body]} value={body}/><AppButton disabled={busy} label={photo ? '사진 다시 선택' : '사진 선택'} onPress={() => void pickPhoto()} tone="secondary"/>{photo ? <AppText tone="muted">사진을 선택했어요. 공유 후 업로드됩니다.</AppText> : null}{message ? <AppText tone="muted">{message}</AppText> : null}<AppButton disabled={busy} label="비공개 초안으로 저장" onPress={() => void save()}/><AppButton disabled={busy || !draftId} label="현재 친구들에게 공유" onPress={() => void share()} tone="secondary"/></KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},content:{flex:1,gap:spacing.md,padding:spacing.xl},input:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:spacing.md,backgroundColor:colors.paper,color:colors.ink},body:{minHeight:140,textAlignVertical:'top'}});
