import { fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import type { HomeSnapshot } from '@/domain/models';

import { HouseGameShell } from '../HouseGameShell';

const snapshot: HomeSnapshot = {
  currentUserId: 'user-a',
  coinBalance: 820,
  house: { id: 'house-a', name: '다은이네 우리집', capacity: 4 },
  members: [
    { id: 'member-a', userId: 'user-a', displayName: '다은', pointColor: '#F18191', role: 'admin' },
    { id: 'member-b', userId: 'user-b', displayName: '한섭', pointColor: '#94BFE0', role: 'member' },
  ],
  animals: [],
  ownedItems: [],
  placements: [],
};

describe('HouseGameShell', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders four member slots and an admin invite entry point', async () => {
    const view = await render(
      <HouseGameShell activeTab="home" onOpenInvite={jest.fn()} onOpenSettings={jest.fn()} snapshot={snapshot}>
        테스트 방
      </HouseGameShell>,
    );

    expect(view.getByLabelText('우리집 식구 2 / 4명')).toBeOnTheScreen();
    expect(view.getAllByLabelText(/식구 자리/)).toHaveLength(4);
    expect(view.getAllByRole('button', { name: '빈 자리로 친구 초대' })).toHaveLength(2);
  });

  it('does not expose an invite entry point to a non-admin member', async () => {
    const view = await render(
      <HouseGameShell
        activeTab="home"
        onOpenInvite={jest.fn()}
        onOpenSettings={jest.fn()}
        snapshot={{ ...snapshot, currentUserId: 'user-b' }}
      >
        테스트 방
      </HouseGameShell>,
    );

    expect(view.queryByRole('button', { name: '빈 자리로 친구 초대' })).not.toBeOnTheScreen();
  });

  it('uses a desktop rail at wide viewport widths', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 760, scale: 1, width: 1280 });

    const view = await render(
      <HouseGameShell activeTab="home" onOpenInvite={jest.fn()} onOpenSettings={jest.fn()} snapshot={snapshot}>
        테스트 방
      </HouseGameShell>,
    );

    expect(view.getByLabelText('데스크톱 방 탐색')).toBeOnTheScreen();
  });

  it('uses labelled shell navigation controls to change sections', async () => {
    const onNavigate = jest.fn();
    const view = await render(
      <HouseGameShell activeTab="home" onNavigate={onNavigate} onOpenInvite={jest.fn()} onOpenSettings={jest.fn()} snapshot={snapshot}>
        테스트 방
      </HouseGameShell>,
    );

    fireEvent.press(view.getByRole('button', { name: '꾸미기로 이동' }));

    expect(onNavigate).toHaveBeenCalledWith('decorate');
  });
});
