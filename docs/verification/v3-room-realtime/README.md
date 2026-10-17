# #166 — room synchronization repair (2026-10-15)

This independent branch starts at `origin/main` `95f031889cdf66bb5c5c94406014c4e7d44faa1f`. PR #164 remains Draft at `92d94f7f9bed03235d4c07c0c1965c9cb06fa67a`; none of its rendering/preview tests or files are removed. The original dirty checkout and backup are untouched.

## Problem and implementation

The existing realtime hook had no application caller and invalidated `['home']`, while the room uses `queryKeys.home.activeSnapshot`. Events therefore did not refresh the displayed authoritative snapshot. Production metadata also showed zero tables in the realtime publication.

- Mount one `HouseRealtimeSync` under authenticated routes after onboarding, rather than one subscription per stacked screen. Demo never mounts it and retains memory-only reset behavior.
- Read current house through the repository; subscribe only when online, foreground, successfully authorized, and the snapshot's current user matches the authenticated account.
- On INSERT/UPDATE and first connection/reconnection, invalidate the real room cache. Never merge event payloads into state or perform any write from a notification.
- Reconcile missed events, removals and access changes through an RLS-checked snapshot every 15 seconds while active/online, and on app resume. This bounded read fallback is intentional; it does not promise immediate deletion delivery.
- Release subscriptions on house/account change, sign-out, background, offline and authorization error. Ignore late callbacks after cleanup. Unique channel topics avoid realtime-js reusing an asynchronously leaving channel during rapid reconnect.
- Limit this repair to room placement events. The previously unused hook's other-table subscriptions were never wired and are not enabled here; memories/social/habits synchronization remains outside #166.

## Migration and privacy boundary

New CLI-generated migration: `20261015022533_room_placement_realtime.sql`. Existing migrations, rows, RLS and grants are unchanged. No production migration or data write was executed.

Supabase documents that DELETE events do not receive the same RLS checks as INSERT/UPDATE. Client subscription filtering alone cannot stop custom clients from requesting DELETE. Independent review caught this in the first migration draft; the final migration fails closed:

1. Create a missing publication as INSERT/UPDATE only.
2. Reconfigure an existing **empty** publication to INSERT/UPDATE only, if necessary.
3. Reject an incompatible **nonempty** publication without changing other tables' delivery behavior.
4. Require insert/update enabled, delete/truncate disabled, then idempotently add only `public.room_placements`. Do not expand replica identity.

Read-only production metadata showed insert/update/delete/truncate enabled and `table_count=0`. The guarded empty-publication path is applicable to that observed configuration, but must be rechecked at application time. The eight pgTAP assertions cover final event flags, membership, RLS and forbidden direct writes. They do not establish actual A/B delivery or all guard branches.

## Verification

`results.json` records the final complete local test count and retained/added names. Baseline main has 64 suites / 258 tests. The higher 284 count belongs to separate PR #164; these independent branches do not contain each other's tests.

- TypeScript and ESLint run on this branch; Demo and Supabase web build/export checks both run. Supabase build success is not authenticated server-play evidence.
- Regression-first evidence: old hook failed actual cache invalidation, reconnect and intended-event registration (3 failures, 1 preexisting pass); asynchronous same-topic rejoin test also failed before unique topic fix.
- Hook/bridge tests cover scope/logout/offline/background cleanup, late events, authoritative refetch, foreign-user cached snapshot rejection, missed-event polling and authorization failure. They use the real QueryClient/repository behavior with a fake transport; they are not actual Supabase websocket tests.
- SQL command `npm run supabase:test` exited 1: `supabase start is not running`. No local Docker/psql runtime or isolated account pair was available. SQL/pgTAP and real realtime privacy isolation remain **unverified locally**; the existing database PR workflow can execute them in isolated CI.
- Independent review found no client blocker, and accepted the revised fail-closed publication guard. This is code review, not SQL execution approval.
- Existing Jest force-exit/open-handle warning remains. No dependency or lockfile changes.

Official reference: [Postgres Changes and RLS/delete behavior](https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records). Current documentation/changelog were checked; installed realtime-js source was inspected for same-topic channel reuse.

## Release gates and follow-up

Keep the PR Draft until isolated SQL/CI results and the missing gameplay evidence are reviewed. Do not close #166 merely because client tests pass.

- In an isolated project: apply the migration, create A/B in one house and C in another, confirm A insert/update appears for B but never C, try unauthorized/custom DELETE subscriptions, background/offline/reconnect, logout and house exit. Verify actual persisted positions after relogin. No such live flow was performed here.
- Confirm the incompatible nonempty publication is rejected atomically without altering its existing tables or flags; run migration twice in a compatible environment.
- #165 still owns command house scope and leave/placement lock races. This read synchronization repair cannot secure an already-dispatched write.
- #154 still owns move/remove/guarded undo and revision-based conflict recovery. #158 owns actual multi-account, RLS, concurrency and physical-device evidence.
- Existing Vercel integration may automatically deploy a branch Preview on push. No manual deploy, production DB apply, Ready transition or merge is authorized by this verification pass.
