import { render } from '@testing-library/react-native';

import type { Member } from '@/domain/models';

import { CoinPill } from '../CoinPill';
import { MemberAvatarRow } from '../MemberAvatarRow';

const members: Member[] = [
  { id: 'member-a', userId: 'user-a', displayName: '나래', pointColor: '#F49A86', role: 'admin' },
  { id: 'member-b', userId: 'user-b', displayName: '민준', pointColor: '#B8D8EB', role: 'member' },
];

describe('MemberAvatarRow', () => {
  it('shows four member positions and one invite entry for an admin with room', async () => {
    const view = await render(<MemberAvatarRow capacity={4} currentUserId="user-a" members={members} onInvite={jest.fn()} />);

    expect(view.getByLabelText('우리집 식구 2 / 4명')).toBeOnTheScreen();
    expect(view.getAllByLabelText(/식구 자리/)).toHaveLength(4);
    expect(view.getAllByRole('button', { name: '빈 자리로 친구 초대' })).toHaveLength(2);
  });

  it('does not show an invite entry to a non-admin member', async () => {
    const view = await render(<MemberAvatarRow capacity={4} currentUserId="user-b" members={members} onInvite={jest.fn()} />);

    expect(view.queryByRole('button', { name: '친구 초대' })).not.toBeOnTheScreen();
  });

  it('exposes a labelled coin balance', async () => {
    const view = await render(<CoinPill balance={1280} />);

    expect(view.getByLabelText('내 코인 1,280')).toBeOnTheScreen();
  });
});
