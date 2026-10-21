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

## 2026-10-19 verification record

- Worktree: `house-access-final-fix/우리집`, branch `codex/house-access-final-fix`, stacked on #167 head `226f624f905b1f4dccfd6d505613063a0849dd7e`. Protected dirty checkout and PR branches remain unchanged. Draft PR #175 contains this fix; no merge or deployment.
- Independent branch at `5329d534f5729f7e792e7700d9950a8f27efa775`: TypeScript, ESLint, 297/297 Jest, Demo and Supabase web builds/exports passed. Integration verification branch `codex/v3-final-access-validation` at `dbc6ec7f75daa6eac4a570d9050f5d2e2470463f` combined #164/#167/#169/#172/#168 plus this fix without #170: TypeScript, ESLint, 333/333 Jest, both web builds/exports passed. The baseline 300 test names remained present; 33 were added and none removed/skipped. Logs and private local screenshots are in `/tmp/cozy-final-access/`.
- Isolated local Supabase: 291 SQL/RLS assertions, 8 transaction-race scenarios, and 6 Auth/REST/Realtime scenarios passed. Actual A/B browsers: A's placement appeared on B without reload in about 2.5 seconds; after A left, A reached the house chooser in about 0.4 seconds and B's reclaimed furniture disappeared without reload in about 3.0 seconds. A delayed old-house response could not overwrite a newly created house; an explicit REST permission denial hid the cached room. Logging out hid private content before the response, and signing in as B showed no A room. A local transport outage recovered after reconnect. Disposable users and five test houses were cleaned by the guarded local fixture script.
- The house creation/join invalidation loop was reproduced in both optimized and development web bundles. Retiring the QueryClient and navigating in the same commit caused the Expo Router update loop. Keep the per-generation QueryClient isolation; schedule the successful create/join route replacement on the next task. A focused route test and optimized web A-create/B-join browser run passed without a new console error, showing 2/4 members immediately after join. The isolated browser run also found an unrelated invite-code defect: the visible eight-character code alone resolves as an invalid preview while the full invite link works. Fix this separately from the access boundary. The second disposable fixture (two users and five test houses) was cleaned.
- After that navigation repair, the independent branch passed TypeScript, ESLint, 298/298 Jest, Demo/Supabase web builds and both export checks. One unforced Jest run completed 298/298 assertions but retained an open handle; a retry with `--forceExit` exited successfully. Exact browser-timed logout/Realtime collision, actual device airplane mode, physical iOS/Android, production Supabase, GitHub Actions, and deployment remain unverified. The PR remains Draft; do not merge #170.
