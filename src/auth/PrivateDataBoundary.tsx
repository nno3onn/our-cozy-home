import type { SupabaseClient } from '@supabase/supabase-js';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, useSegments } from 'expo-router';
import { type PropsWithChildren, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { RepositoryProvider, useRepository } from '@/repositories/RepositoryContext';
import { HouseRealtimeSync } from '@/realtime/HouseRealtimeSync';
import { colors, spacing } from '@/theme/tokens';
import { useOptionalAuth } from './AuthProvider';
import { PrivateDataScope } from './PrivateDataScope';
import { PrivateScopeContext, usePrivateScope, usePrivateScopeState } from './PrivateScopeContext';
import { isTransportFailure } from './privateErrors';
import { useHouseShellStore } from '@/features/house-shell/store/useHouseShellStore';
import { useDecorateStore } from '@/features/decorate/store/useDecorateStore';

export function PrivateDataBoundary({ userId, client, children }: PropsWithChildren<{ userId: string; client?: SupabaseClient }>) {
  return <IdentityBoundary key={userId} userId={userId} client={client}>{children}</IdentityBoundary>;
}

function IdentityBoundary({ userId, client, children }: PropsWithChildren<{ userId: string; client?: SupabaseClient }>) {
  const source = useRepository();
  const auth = useOptionalAuth();
  const [scope] = useState(() => new PrivateDataScope(userId, source, () => {
    useHouseShellStore.getState().reset();
    useDecorateStore.getState().clearSelection();
  }));
  const state = useSyncExternalStore(scope.subscribe, scope.getSnapshot, scope.getSnapshot);
  const mounted = useRef({ count: 0 });
  const registerDataScope = auth?.registerDataScope;
  useEffect(() => registerDataScope?.(scope.retire), [registerDataScope, scope]);
  useEffect(() => {
    const lifecycle = mounted.current;
    lifecycle.count++;
    return () => {
      lifecycle.count--;
      queueMicrotask(() => { if (!lifecycle.count) scope.retire(); });
    };
  }, [scope]);

  return <PrivateScopeContext.Provider value={scope}>
    <QueryClientProvider key={state.clientEpoch} client={state.client}>
      <RepositoryProvider repository={state.repository}>
        {client ? <HouseRealtimeSync client={client} userId={userId} /> : null}
        <HouseAccessGate>{children}</HouseAccessGate>
      </RepositoryProvider>
    </QueryClientProvider>
  </PrivateScopeContext.Provider>;
}

function HouseAccessGate({ children }: PropsWithChildren) {
  const scope = usePrivateScope()!;
  const state = usePrivateScopeState()!;
  const auth = useOptionalAuth();
  const home = useHomeSnapshot();
  const online = useConnectionStatus();
  const segments = useSegments();
  const entry = segments[0] === 'house' || segments[0] === 'invite';
  const settings = segments[0] === 'settings';
  const center = { flex: 1, justifyContent: 'center' as const, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background };

  if (state.phase === 'retired') return <View style={center}>
    {auth?.signOutError ? <><InlineNotice title="로그아웃을 완료하지 못했어요" message={auth.signOutError} tone="danger" /><AppButton label="다시 로그아웃" onPress={() => void auth.signOut()} /></> : <View accessibilityLabel="계정 전환 중"><Skeleton height={52} /></View>}
  </View>;
  if (state.phase === 'denied') return <View style={center}>
    <InlineNotice title="집 접근 권한을 확인하지 못했어요" message="이전 집 정보는 숨겼어요. 연결과 권한을 다시 확인해 주세요." tone="danger" />
    <AppButton label="권한 다시 확인" disabled={!online} onPress={scope.recheck} />
    {auth ? <AppButton label="로그아웃" onPress={() => void auth.signOut()} tone="quiet" /> : null}
  </View>;
  if (state.phase === 'no-house') return entry || settings ? children : <Redirect href="/house/choose" />;
  if (!online && !home.data && !entry && !settings) return <View style={center}><InlineNotice title="연결 후 우리집을 확인할 수 있어요" message="아직 저장 상태를 확인하지 못했어요. 연결되면 다시 확인할게요." tone="warning" /></View>;
  if (home.isError) return <View style={center}>
    <InlineNotice title="집을 확인하지 못했어요" message={isTransportFailure(home.error) ? '연결을 확인한 뒤 다시 시도해 주세요.' : '이전 집 정보는 표시하지 않아요. 다시 확인해 주세요.'} tone="warning" />
    <AppButton label="다시 확인" disabled={!online} onPress={() => void home.refetch()} />
  </View>;
  if (!home.data) return entry || settings ? children : <View style={center} accessibilityLabel="우리집 권한과 저장 상태 확인 중"><Skeleton height={52} /><Skeleton height={320} /></View>;
  return children;
}
