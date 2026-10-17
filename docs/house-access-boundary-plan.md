# House access and private cache repair

Contract: user request dated 2026-10-17. Repair existing access lifecycle only; retain Demo/offline read-only behavior, RLS and no DELETE payload policy. No migration, operational DB write, deployment or merge.

## Scope and dependency

This narrow follow-up is stacked on the exact protected #167 head `226f624f905b1f4dccfd6d505613063a0849dd7e` so the PR contains only the lifecycle repair, not a duplicate Realtime implementation. Do not modify that branch. Separately apply this diff to the existing #164/#167/#169/#172 aggregate and preserve all 300 tests. #170 is a verification reference, never a merge target.

## Implementation sequence

- Reproduce cached Decorate content after permission denial, plus deferred requests/auth changes and Realtime callback races.
- Add a per-authenticated-identity private QueryClient boundary with a monotonic house generation. Retire callbacks first, cancel queries and clear private caches second, then publish the next boundary. Ignore results and callbacks captured by retired generations.
- Interpose existing repository operations: successful leave clears the house boundary before its promise returns; successful create/join starts a fresh boundary. Query denials hide all protected content; transport failures do not revoke offline cache. No server write authority is implemented in this boundary.
- Fence Auth bootstrap/onboarding by identity generation; retire private scope before logout/account changes are announced. Block old content even while logout is pending or fails.
- Use the existing authoritative snapshot poll for removals; pause offline/background, reconcile on return, never subscribe to DELETE payloads.
- Verify loading versus confirmed room state, error plus cache, old response after new house, logout plus queued event, offline read-only/reconnect and permission revocation.
- Run TypeScript/ESLint/full Jest and both web exports independently and with the aggregate; run actual disposable Supabase A/B browser flow and explicit SQL permission denial. Report browser transport interruption separately from device airplane-mode testing.
- Create a new Draft PR and attach it. Preserve all original files/backups/protected PRs and leave production untouched.

Remote revocation is detected by an authoritative lookup/event reconciliation, bounded by the existing 15-second active poll plus network latency. Offline cache is not treated as evidence of renewed server permission. Once a definitive denial or leave is observed, old data must be removed synchronously and must never reappear from an older request.
