# #165: scoped placement and departure security verification

Verified on 2026-10-16. This is a Draft change, not an approved production release.

## Scope and preservation

- Base main: `95f031889cdf66bb5c5c94406014c4e7d44faa1f`.
- Independent security code/test SHA: `d5a4dce8f5854a0a29067f91e5cbe3cb46ab9bb6` — PR #169.
- Combined verification SHA: `b7262227e907871f1be7cdc1721862734c0cdc1e` — verification-only PR #170, do not merge this aggregate branch.
- Exact protected inputs: #164 `92d94f7f9bed03235d4c07c0c1965c9cb06fa67a`, #167 `226f624f905b1f4dccfd6d505613063a0849dd7e`. Neither branch/PR was edited or merged.
- All 549 files in the backup manifest match the original checkout byte-for-byte. Original HEAD remains `76286654a1d701086a5f359c5d646481e8da5b9a`; its existing 210 porcelain entries were not cleaned or committed. Backup files were read only.
- Only one new migration is added by #169: `20261015063208_scoped_room_placement_authority.sql`. Existing migrations, economy and user assets are unchanged. Branch-specific Vercel guards prevent automatic previews for both branches. No production release workflow, production migration/data write or merge was performed.

## Risk evidence and the server contract

The legacy RPC selects the active house before waiting on its house lock, then does not recheck membership. A departure committing across that wait is a code-inspected risk condition; no production exploit or executable baseline exploit was reproduced. Existing owner/version/UNIQUE checks already existed; arbitrary foreign-item placement was not established as a pre-existing bypass. The new tests reproduce the dangerous schedules against the replacement and inspect committed database state.

`place_owned_item_scoped(house,item,slot,expectedVersion,requestKey)` requires an authenticated, active profile, non-null validated inputs and READ COMMITTED. It takes the caller advisory lock used by create/accept/leave/account deletion, then requested house row lock, verifies active house state and reads fresh active membership AFTER waiting. It never redirects to a different active house. Membership writers were inspected; direct membership DML has no authenticated RLS write policy. A caller-supplied stale isolation snapshot is rejected.

No membership row lock is taken by placement. Existing invite takes membership then house; acquiring membership after house here would introduce a deadlock inversion. Real competing sessions cover this invite/placement schedule too.

Owned-item row locking, owner/recovery/kind/positive-quantity/slot/memory-access checks, expectedVersion and existing `(house_id,slot_id)` / `(owned_item_id)` UNIQUE constraints protect mutation. Active members may replace shared slots using their own items (explicit user decision); displaced items remain owned inventory. Movement between already occupied slots is not introduced.

Private per-profile request receipts bind house/item/slot/expectedVersion. Identical retries return the original acknowledgement without reapplying it, after current authority checks. Payload mismatch fails. Placement and receipt commit or roll back together. Historical acknowledgements need not describe the current room; the client invalidates and rereads authoritative state. Legacy RPC has both execution revoked and an unconditional deny body; there is no client fallback.

## Local automatic checks

| Check | Independent | Combined #164/#167/#165 |
| --- | --- | --- |
| TypeScript | pass | pass |
| ESLint | pass | pass |
| Full Jest | 64 suites / 261 tests | 69 suites / 297 tests |
| Demo web build/export | pass | pass |
| Supabase web build/export | pass, loopback placeholder config | pass, loopback placeholder config |

Main baseline: 64 suites / 258 tests. #169 retains every baseline test name and adds three contract regressions. #164 previously renamed one DecorateTray case and changed foreign-owner inventory visibility; its own-item selection and foreign-selection denial remain. No test was removed to make this security change pass. Combined adds an old-house preview projection regression. See `verification/v3-placement-authority/local-results.json`.

Combined Jest includes 320px/1280px slot rendering, layering/touch ownership, preview/cancel/confirm/failure/conflict, offline read-only and account/house preview reset. These are automatic component/model checks, not newly performed browser/device play tests. App source did not change between local validation commits and the final tested code SHAs; later commits added SQL/transport harness and evidence only.

## Actual disposable SQL and server API checks

These ran in GitHub Actions with a fresh local Supabase Docker stack, real PostgreSQL transactions and genuine local Auth/REST/WebSocket services. No production credentials are used. The runners restrict connections to literal loopback, require explicit disposable-fixture mode, and clean their own fixture users/data. Job success includes successful cleanup.

| Gate | #169 | Combined |
| --- | --- | --- |
| Migration-only catalog | 7 assertions pass | 7 assertions pass |
| Full pgTAP / SQL / RLS | 22 files / 283 assertions pass | 23 files / 291 assertions pass |
| Separate-session race scenarios | all 8 groups pass | all 8 groups pass |
| Password Auth, invite/join, placement REST | pass | pass |
| Sign-out / password re-login / session refresh persistence | pass | pass |
| A update immediately followed by leave; B authoritative empty room / A assets retained | pass | pass |
| Departed A with valid JWT denied old-house write | pass | pass |
| B actual WebSocket INSERT / UPDATE | intentionally skipped: #169 alone does not publish room table | pass, server confirms PostgreSQL subscription |

Eight race groups: membership/ownership/kind/slot/legacy denials; stale transaction snapshot rejection; A/B same-slot contention plus uniqueness/version; lost-response duplicate/payload conflict/stale receipt/aborted and disconnected retry; invite membership-lock versus placement house-lock; place-first then leave; leave-first then delayed place; old-house request after new-house creation and historical replay. Waiting order is established with `pg_stat_activity` / `pg_blocking_pids`, not sleep-based assumptions. Assertions inspect placement version/count, receipt count and preserved assets.

Evidence: [independent Actions](https://github.com/nno3onn/our-cozy-home/actions/runs/38843300779), [combined Actions](https://github.com/nno3onn/our-cozy-home/actions/runs/38843313581), and adjacent `isolated-*-results.json`.

An earlier harness run stalled awaiting idle psql exit after backend termination; it was canceled, bounded and corrected by making the client observe its closed connection. An initial combined transport run passed SQL/races but missed INSERT after channel join. The installed SDK documents channel join before WAL readiness; waiting for confirmed PostgreSQL subscription corrected the test setup. The final combined run received real INSERT and UPDATE events. These earlier canceled/failed runs are not counted as passing evidence.

## Unverified and integration boundaries

- No production or hosted-staging execution, production RLS/capacity/latency audit or Vercel deployment. A successful Supabase web export alone is not a server-connection test.
- Follow-up single-agent Demo browser interaction at 320×740 / 1280×800 verifies preview/cancel/confirm and no outer horizontal overflow; see `verification/v3-placement-authority/browser-demo/`. Full fresh-session initialization was not established: the reload API retained state and a new direct tab was browser-policy blocked. Human two-person Supabase UI play, physical iOS/Android and device background/resume remain unverified. Prior Auth/session refresh and fresh REST verification is programmatic server evidence.
- Demo retains memory-only reset on reload. This is intentional, not a persistence defect.
- The test waits for WAL readiness. The unchanged #167 application still reconciles by authoritative fetch and a 15-second active polling fallback; this work does not claim an immediate UI-delivery guarantee during subscription startup or change its protected branch.
- PR #170 is a disposable aggregate verification vehicle. Its conflict resolutions must be carried when eventually integrating independent feature PRs: captured preview scope/request identity, old-house preview rejection, combined Demo guards, exact error mapping and additive tests. Never merge it accidentally as a substitute for review.

## Approved-release preparation and safe rollback (not executed)

1. Review independent security contract and aggregate evidence; rehearse with isolated staging accounts and actual two-person/device play. Review the aggregate conflict resolutions before integrating #164/#167/#169.
2. Back up staging/production as appropriate, confirm migration history and plan a placement read-only maintenance window. Old clients intentionally fail closed after this server change; a compatible client and server rollout must be coordinated and approved together. Test the new RPC/schema cache before reopening writes.
3. Obtain explicit approval for production migration/deployment/merge. No such approval is assumed here.
4. If a deployed change fails, revoke new RPC execution and keep placement read-only while a forward fix is reviewed. Do not restore the insecure legacy inference RPC, drop request receipts, delete assets or edit historical migrations. Use a new migration for any revised contract.
