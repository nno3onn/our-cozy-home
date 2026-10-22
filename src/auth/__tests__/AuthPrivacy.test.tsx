import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, userEvent, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Button, Text } from 'react-native';
import type { Database } from '@/types/database.generated';
import { AuthProvider, useAuth } from '../AuthProvider';

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const session = (id: string) => ({ user: { id } }) as Session;
function fixture() {
  let changed!: (event: AuthChangeEvent, session: Session | null) => void;
  const bootstrap = deferred<{ data: { session: Session | null } }>();
  const rows = new Map<string, Promise<{ data: { id: string } | null; error: { message: string } | null }>>();
  const client = {
    auth: {
      getSession: jest.fn(() => bootstrap.promise),
      onAuthStateChange: jest.fn((callback) => { changed = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; }),
      signOut: jest.fn(async () => ({ error: null as null | { message: string } })),
    },
    from: jest.fn(() => ({ select: () => ({ eq: (_key: string, id: string) => ({ maybeSingle: () => rows.get(id) ?? Promise.resolve({ data: { id }, error: null }) }) }) })),
  };
  const queries = new QueryClient();
  const retires: string[] = [];
  let capturedSignOut: (() => Promise<void>) | undefined;
  function Probe() {
    const auth = useAuth();
    const registerDataScope = auth.registerDataScope;
    useEffect(() => registerDataScope?.(() => retires.push('retired')), [registerDataScope]);
    useEffect(() => { capturedSignOut = auth.signOut; }, [auth.signOut]);
    return <><Text>{`${auth.state.status}:${auth.state.status === 'signed_in' ? auth.state.userId : ''}:${auth.onboarding}`}</Text><Button title="sign out" onPress={() => void auth.signOut()} /><Text>{auth.signOutError}</Text></>;
  }
  const tree = <QueryClientProvider client={queries}><AuthProvider client={client as unknown as SupabaseClient<Database>}><Probe /></AuthProvider></QueryClientProvider>;
  return { bootstrap, rows, client, queries, tree, retires, getSignOut: () => capturedSignOut!, emit: (event: AuthChangeEvent, value: Session | null) => changed(event, value) };
}

it('ignores a late bootstrap result after a newer sign-in event', async () => {
  const f = fixture(), view = await render(f.tree);
  await act(async () => f.emit('SIGNED_IN', session('B')));
  expect(await view.findByText('signed_in:B:complete')).toBeOnTheScreen();
  await act(async () => f.bootstrap.resolve({ data: { session: session('A') } }));
  expect(view.getByText('signed_in:B:complete')).toBeOnTheScreen();
  expect(view.queryByText('signed_in:A:complete')).not.toBeOnTheScreen();
  await view.unmount(); f.queries.clear();
});

it('fences a previous account onboarding failure and old token refresh after account switch', async () => {
  const f = fixture(), oldRows = deferred<{ data: { id: string } | null; error: { message: string } | null }>();
  f.rows.set('A', oldRows.promise);
  const view = await render(f.tree);
  await act(async () => f.emit('SIGNED_IN', session('A')));
  await act(async () => f.emit('SIGNED_IN', session('B')));
  expect(await view.findByText('signed_in:B:complete')).toBeOnTheScreen();
  await act(async () => { oldRows.resolve({ data: null, error: { message: 'A no longer allowed' } }); f.emit('TOKEN_REFRESHED', session('A')); });
  expect(view.getByText('signed_in:B:complete')).toBeOnTheScreen();
  await view.unmount(); f.queries.clear();
});

it('retires private data before starting logout, and reports transport failure without reopening it', async () => {
  const f = fixture(), logout = deferred<{ error: { message: string } | null }>();
  const view = await render(f.tree);
  await act(async () => f.emit('SIGNED_IN', session('A')));
  await view.findByText('signed_in:A:complete');
  f.retires.length = 0;
  f.client.auth.signOut.mockImplementation(() => { expect(f.retires).toEqual(['retired']); return logout.promise; });
  await userEvent.setup().press(view.getByRole('button', { name: 'sign out' }));
  expect(f.retires).toEqual(['retired']);
  await act(async () => logout.resolve({ error: { message: 'network failed' } }));
  expect(await view.findByText('연결을 확인한 뒤 다시 로그아웃해 주세요.')).toBeOnTheScreen();
  await act(async () => f.emit('SIGNED_OUT', null));
  await waitFor(() => expect(view.getByText('signed_out::loading')).toBeOnTheScreen());
  await view.unmount(); f.queries.clear();
});

it('does not let an old account logout callback sign out the new identity', async () => {
  const f = fixture(), view = await render(f.tree);
  await act(async () => f.emit('SIGNED_IN', session('A')));
  await view.findByText('signed_in:A:complete');
  const oldSignOut = f.getSignOut();
  await act(async () => f.emit('SIGNED_IN', session('B')));
  await view.findByText('signed_in:B:complete');
  const retired = f.retires.length;
  await act(async () => oldSignOut());
  expect(f.client.auth.signOut).not.toHaveBeenCalled();
  expect(f.retires).toHaveLength(retired);
  expect(view.getByText('signed_in:B:complete')).toBeOnTheScreen();
  await view.unmount(); f.queries.clear();
});
