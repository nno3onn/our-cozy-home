import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';

import { DecorateScreen } from '../DecorateScreen';

describe('DecorateScreen', () => {
  it('replaces a fixed-slot item while preserving its owner', async () => {
    const repository = new DemoRepository();
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={repository}>
          <DecorateScreen />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('복숭아 조개 쿠션 배치 중')).toBeOnTheScreen();
    await fireEvent.press(view.getByRole('button', { name: '민트 매듭 쿠션 선택' }));
    await waitFor(() => expect(view.getByText('선택: 민트 매듭 쿠션')).toBeOnTheScreen());
    await fireEvent.press(view.getByRole('button', { name: '방에서 미리보기' }));
    await fireEvent.press(view.getByRole('button',{name:'여기에 놓기'}));

    await waitFor(() => expect(view.getByText('민트 매듭 쿠션 배치 중')).toBeOnTheScreen());
    expect(view.getAllByText('소유자 나래')).toHaveLength(2);

    const snapshot = await repository.getHomeSnapshot();
    expect(snapshot.placements.find((placement) => placement.slotId === 'floor-accent-left')).toEqual(
      expect.objectContaining({ ownedItemId: 'owned-mint-cushion', version: 2 }),
    );
    await waitFor(() => expect(client.isMutating()).toBe(0));
    await view.unmount();
    client.clear();
  });

  it('keeps placement details visible but disables replacement offline', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const view = await render(
      <ConnectionProvider state={offlineState}>
        <QueryClientProvider client={client}>
          <RepositoryProvider repository={new DemoRepository()}>
            <DecorateScreen />
          </RepositoryProvider>
        </QueryClientProvider>
      </ConnectionProvider>,
    );

    expect(await view.findByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByText('복숭아 조개 쿠션 배치 중')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '방에서 미리보기' })).toBeDisabled();
  });

  it('shows a friend-owned placement without offering controls to move it', async () => {
    class SharedRoomRepository extends DemoRepository {
      override async getHomeSnapshot() {
        const snapshot = await super.getHomeSnapshot();
        snapshot.ownedItems.push({
          id: 'owned-friend-star-cushion',
          ownerId: 'user-minseo',
          itemDefinitionId: 'cushion-star',
          kind: 'furniture',
          allowedSlotIds: ['floor-accent-left', 'floor-accent-right'],
          quantity: 1,
        });
        snapshot.placements = snapshot.placements.map((placement) =>
          placement.slotId === 'floor-accent-left'
            ? { ...placement, ownedItemId: 'owned-friend-star-cushion' }
            : placement,
        );
        return snapshot;
      }
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new SharedRoomRepository()}>
          <DecorateScreen />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('별 쿠션 배치 중')).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: '별 쿠션 선택' })).not.toBeOnTheScreen();
  });

  it('keeps the offline notice above the wide room-and-aside layout', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 720, scale: 1, width: 1280 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const view = await render(
      <ConnectionProvider state={offlineState}>
        <QueryClientProvider client={client}>
          <RepositoryProvider repository={new DemoRepository()}><DecorateScreen /></RepositoryProvider>
        </QueryClientProvider>
      </ConnectionProvider>,
    );

    expect(await view.findByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByTestId('wide-decorate-content')).toBeOnTheScreen();
  });
});

async function previewFixture(repository=new DemoRepository()){
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{retry:false,gcTime:Infinity}}});
 const original=repository.placeItem.bind(repository);const place=jest.spyOn(repository,'placeItem');
 const view=await render(<QueryClientProvider client={client}><RepositoryProvider repository={repository}><DecorateScreen/></RepositoryProvider></QueryClientProvider>);
 await view.findByText('복숭아 조개 쿠션 배치 중');
 await fireEvent.press(view.getByRole('button',{name:'민트 매듭 쿠션 선택'}));
 await fireEvent.press(view.getByRole('button',{name:'방에서 미리보기'}));
 return {repository,client,view,place,original};
}
it('preview and cancel do not write or change the confirmed snapshot',async()=>{
 const {repository,client,view,place}=await previewFixture();const before=await repository.getHomeSnapshot();
 expect(place).not.toHaveBeenCalled();expect(view.getByLabelText('민트 매듭 쿠션')).toBeOnTheScreen();
 await fireEvent.press(view.getByRole('button',{name:'미리보기 취소'}));
 expect(view.getByLabelText('복숭아 조개 쿠션')).toBeOnTheScreen();expect(await repository.getHomeSnapshot()).toEqual(before);expect(place).not.toHaveBeenCalled();
 await view.unmount();client.clear();
});
it('preserves the captured version when another edit arrives and never overwrites it',async()=>{
 const {repository,client,view,place}=await previewFixture();
 await repository.placeItem({ownedItemId:'owned-mint-cushion',slotId:'floor-accent-left',expectedVersion:1});
 await client.invalidateQueries();place.mockClear();
 await fireEvent.press(view.getByRole('button',{name:'여기에 놓기'}));
 await view.findByText('배치가 변경됐어요. 최신 모습을 확인하고 다시 미리 봐 주세요.');
 expect(place).toHaveBeenCalledWith({ownedItemId:'owned-mint-cushion',slotId:'floor-accent-left',expectedVersion:1});
 expect((await repository.getHomeSnapshot()).placements.find(p=>p.slotId==='floor-accent-left')?.version).toBe(2);
 expect(view.queryByTestId('placement-preview-controls')).toBeNull();await view.unmount();client.clear();
});
it('keeps a network failure recoverable without claiming success or optimistic inventory changes',async()=>{
 const {repository,client,view,place}=await previewFixture();const before=await repository.getHomeSnapshot();place.mockRejectedValueOnce(new Error('network unavailable'));
 await fireEvent.press(view.getByRole('button',{name:'여기에 놓기'}));await view.findByText('가구를 놓지 못했어요. 현재 배치를 확인하고 다시 시도해 주세요.');
 expect(await repository.getHomeSnapshot()).toEqual(before);expect(view.queryByTestId('placement-preview-controls')).toBeNull();
 await view.unmount();client.clear();
});
it('confirms a pending preview once even when pressed repeatedly',async()=>{
 const {client,view,place,original}=await previewFixture();let finish!:()=>void;
 place.mockImplementationOnce(async input=>{await new Promise<void>(resolve=>{finish=resolve;});return original(input);});
 await fireEvent.press(view.getByRole('button',{name:'여기에 놓기'}));
 await fireEvent.press(view.getByRole('button',{name:'여기에 놓기'}));expect(place).toHaveBeenCalledTimes(1);expect(view.getByRole('button',{name:'미리보기 취소'})).toBeDisabled();
 finish();await waitFor(()=>expect(client.isMutating()).toBe(0));await view.unmount();client.clear();
});
