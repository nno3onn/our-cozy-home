import { render, userEvent } from '@testing-library/react-native';

import { MemoryComposerScreen } from '../MemoryComposerScreen';

describe('MemoryComposerScreen', () => {
  it('shows the exact current share audience and saves a private draft before sharing', async () => {
    const saveDraft = jest.fn().mockResolvedValue({ id: 'draft-1', status: 'private_draft' });
    const view = await render(<MemoryComposerScreen members={[{ id: 'm1', userId: 'u1', displayName: '나래', pointColor: '#fff', role: 'admin' }, { id: 'm2', userId: 'u2', displayName: '민준', pointColor: '#eee', role: 'member' }]} onSaveDraft={saveDraft} onShareDraft={jest.fn()} />);
    const user = userEvent.setup();

    expect(view.getByText('현재 집 친구들에게 공유돼요')).toBeOnTheScreen();
    expect(view.getByText('나래 · 민준')).toBeOnTheScreen();
    await user.type(view.getByLabelText('추억 제목'), '비 오는 오후');
    await user.type(view.getByLabelText('추억 글'), '창가에서 같이 노래를 들었어요.');
    await user.press(view.getByRole('button', { name: '비공개 초안으로 저장' }));

    expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ title: '비 오는 오후', body: '창가에서 같이 노래를 들었어요.' }));
    expect(await view.findByText('초안으로 저장했어요. 공유하기를 눌러야 친구들에게 보여요.')).toBeOnTheScreen();
  });
});
