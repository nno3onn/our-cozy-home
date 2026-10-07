import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { CreateMemoryDraftInput, Member, MemoryShareResult } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { spacing } from '@/theme/tokens';
import { selectAndPrepareMemoryPhoto, type PreparedMemoryPhoto } from '../photo/photoPicker';

export function MemoryComposerScreen({ members, onSaveDraft, onShareDraft, onUploadPhoto }: { members: Member[]; onSaveDraft(input: CreateMemoryDraftInput): Promise<{ id: string }>; onShareDraft(memoryId: string): Promise<MemoryShareResult>; onUploadPhoto?: (memoryId: string, photo: PreparedMemoryPhoto) => Promise<void> }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [draftId, setDraftId] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [photo, setPhoto] = useState<PreparedMemoryPhoto | null>(null);
  const save = async () => { if (!title.trim()) return setMessage('제목을 적어 주세요.'); setBusy(true); try { const draft = await onSaveDraft({ title: title.trim(), body, occurredOn: new Date().toISOString().slice(0, 10) }); setDraftId(draft.id); setMessage('초안으로 저장했어요. 공유하기를 눌러야 친구들에게 보여요.'); } catch { setMessage('초안을 저장하지 못했어요. 작성한 내용은 그대로 있어요.'); } finally { setBusy(false); } };
  const share = async () => {
    if (!draftId) return;
    setBusy(true);
    try {
      const result = await onShareDraft(draftId);
      if (photo && onUploadPhoto) {
        try { await onUploadPhoto(draftId, photo); }
        catch { setMessage('사진 업로드에 실패했어요. 글과 선택한 사진은 유지됐어요. 다시 시도해 주세요.'); return; }
      }
      setMessage(`${result.viewerCount}명에게 공유했어요.`);
    } catch {
      setMessage('추억을 공유하지 못했어요. 작성한 내용은 그대로 있어요.');
    } finally {
      setBusy(false);
    }
  };
  const pickPhoto = async () => { try { setPhoto(await selectAndPrepareMemoryPhoto()); } catch (error) { setMessage(error instanceof Error ? error.message : '사진을 준비하지 못했어요.'); } };
  return <ResponsivePage fill testID="memory-composer-page"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><AppPageHeader backHref="/(tabs)/memories" title="새 추억 기록" /><AppSection title="공유 대상" description="현재 집 친구들에게 공유돼요"><AppText tone="secondary">{members.map((member) => member.displayName).join(' · ')}</AppText><AppText tone="tertiary" variant="caption">공유 전에는 나만 볼 수 있어요</AppText></AppSection><AppInput label="추억 제목" onChangeText={setTitle} placeholder="오늘의 제목" value={title}/><AppInput label="추억 글" multiline onChangeText={setBody} placeholder="함께한 순간을 적어 주세요" style={styles.body} value={body}/><View style={styles.photoRow}><AppButton disabled={busy} label={photo ? '사진 다시 선택' : '사진 선택'} onPress={() => void pickPhoto()} tone="secondary"/>{photo ? <AppText tone="secondary" variant="caption">선택 완료 · 공유 후 업로드</AppText> : null}</View>{message ? <InlineNotice message={message} tone={message.includes('못했') || message.includes('실패') ? 'danger' : message.includes('공유했') ? 'success' : 'info'} /> : null}<View style={styles.actions}><AppButton disabled={busy} label="비공개 초안으로 저장" onPress={() => void save()}/><AppButton disabled={busy || !draftId} label="현재 친구들에게 공유" onPress={() => void share()} tone="secondary"/></View></ScrollView></KeyboardAvoidingView></ResponsivePage>;
}
const styles=StyleSheet.create({keyboard:{flex:1},content:{flexGrow:1,gap:spacing.lg,paddingBottom:spacing.xl},body:{minHeight:160,paddingTop:spacing.lg,textAlignVertical:'top'},photoRow:{alignItems:'center',flexDirection:'row',flexWrap:'wrap',gap:spacing.md},actions:{gap:spacing.sm,marginTop:'auto'}});
