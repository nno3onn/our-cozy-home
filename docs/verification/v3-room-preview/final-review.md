# PR #164 final verification — 2026-10-15

**Recommendation: keep Draft; do not merge yet.** Local rendering/preview checks pass, but safe two-account server play is not demonstrated. Existing integration gaps are tracked in #165 and #166. Neither issue is fixed by a successful Vercel build.

## Revision and preservation

- Initial PR head: `7da0db5434c0de11a7d4a9aefa383fbb115dcc9d`.
- Verified source commit: `ee328f0f1b37d281d0c8b96b22da7038c2d778fa`. Subsequent verification-document commits do not alter runtime code.
- Worktree: `/Users/nno3onn/.codex/worktrees/v3-room-rendering-preview/우리집`, branch `codex/v3-room-rendering-preview`.
- Original dirty checkout: 549 manifest entries compared by SHA256, zero missing/changed. Backup files were not written. No reset, clean, force push, old-migration edits, production writes, or main merge.

## Defects fixed within this PR

1. **Preview scope:** a cached home/account change left a previous house's unconfirmed preview available to confirm. Keying the editing session by house and current user resets unconfirmed state. Two regressions change the query snapshot while previewing and require the controls to disappear with zero writes. This does not cancel or scope a server request already sent; see #165.
2. **Demo contract:** direct repository calls allowed another owner's item, a nonzero expected version for an empty slot, or the same owned item in two slots. Guards now reject all three without mutating the confirmed room. These are Demo defects, not claims of a new server ownership bypass. Existing memory-only storage/reset policy is unchanged.

All five regressions failed against the old implementation (5 failed / 14 passed), then passed after the fixes. A validation test initially used the wrong catalog selector and was corrected from `kind` to `source === 'memory'`; no product code was changed for that test setup error.

## Files changed in this verification pass

| File | Reason |
| --- | --- |
| `src/features/decorate/screens/DecorateScreen.tsx` | Reset editing session on house/account change |
| `src/features/decorate/screens/__tests__/DecorateScreen.test.tsx` | Two scope-change regressions |
| `src/repositories/demo/DemoRepository.ts` | Owner/version/unique-placement guards |
| `src/repositories/demo/__tests__/DemoRepository.test.ts` | Three rejected-write regressions |
| `src/features/illustrated-ui/scene/__tests__/RoomScene.test.tsx` | Actual catalog memory hit rectangles vs 1–4 animals, at 320/1280 |
| This report, `final-review-results.json`, `final-320-preview.png`, `final-1280-confirmed.png` | Evidence and explicit release gates |

## Local automatic verification

| Check | Result |
| --- | --- |
| Initial head full Jest | 67 suites, all 277 tests pass |
| Final full Jest | 67 suites, all 284 tests pass; all 277 original full test names retained, 7 added, 0 removed/skipped |
| TypeScript `npm run typecheck` | Exit 0 |
| ESLint `npm run lint` | Exit 0, no warnings/errors |
| Demo `npm run build:web` / `verify:web:export` | Both exit 0 |
| Supabase `npm run build:web` / `verify:web:export` | Both exit 0; compilation/export only, not authenticated play |
| `git diff --check` | Pass |

The existing Jest `--forceExit`/open-handle warning remains. Test counts do not establish frame rate, native behavior or server race safety. Exact retained/added names are in `final-review-results.json`.

Existing tests exercise all 35 decorative catalog items in their allowed slots at 320/1280, foot-depth order, parent-clipped 44pt memory hit areas, owner-filtered inventory, preview/cancel, captured-version conflict, rejected network write, offline read-only, and duplicate confirmation prevention. The two added geometry cases iterate all valid memory items/slots and 1–4 companions; intersection area is zero. This is renderer geometry validation, not physical-device hit testing.

## Browser Demo play (actual UI actions)

- Isolated local server on port 8083; original 8081 session untouched.
- At 320×800: select mint cushion → preview → cancel restores peach → select again → preview → explicit confirm shows mint as placed.
- At 1280×900: confirmed room and separate inventory panel visible without room/panel overlap. Inventory has its own scroll area; that internal scroll is intentional.
- Document scroll dimensions equal viewport: 320×800 and 1280×900. Preview is labeled `방에서 미리 보고 있어요` with separate cancel/confirm actions; controls disappear after confirmation.
- Navigate to Home: confirmed mint remains in the same Demo repository session. Reload: peach seed returns, **expected Demo policy**, not persistence failure. This supersedes the old report's wording that called reload persistence unmet.
- Screenshots: [mobile preview](final-320-preview.png), [desktop confirmed](final-1280-confirmed.png).

## Supabase: what was actually checked

No isolated cozy-home test project, test-account pair, or local Docker/Postgres runtime was available. The unrelated connected project was not used. **No authenticated placement, login/logout, persistence, A/B conflict or leave flow was executed.** No production data was written or modified.

Production metadata was read only through the administrator connector:

- `place_owned_item(uuid,text,integer)` exists; function definition checks `auth.uid()`, owned-item owner, allowed slot, expected version (including empty slot version zero), and serializes through a house-row lock. `room_placements` has RLS enabled. These observations do not verify caller-facing permissions end to end.
- Legacy function resolves active membership before taking the house lock, with no active-membership/house-status recheck after the lock. A leave transaction winning that lock can invalidate the earlier authorization: **code-inspection risk, not a reproduced race**. The request also lacks an intended house ID. Follow-up **#165** must validate the contract and both lock schedules in isolation before declaring this safe.
- Source has `useHouseRealtime`/`subscribeHouseRealtime` but no application call site. `pg_publication_tables` returns zero rows for `supabase_realtime` + `room_placements`. Thus automatic A→B propagation is currently unconnected: follow-up **#166**. Refresh/focus refetch is not a substitute for verified realtime delivery.
- Metadata reports EXECUTE for `anon` as well as `authenticated`; the body rejects null `auth.uid()`. This is preexisting deployed privilege drift, not a demonstrated anonymous data-write bypass; audit/restrict grants as part of #165 rather than silently altering production.

## Actual external CI vs local results

At initial head `7da0db5`, provider diagnostics reported Vercel deployment success and Vercel Preview Comments success. They did **not** report a GitHub Actions TypeScript/Jest/SQL run. The database workflow only triggers for `supabase/**` or its workflow path; this source-only PR does not trigger it. Updated-head CI status must be read from PR checks after push and is recorded in the PR verification comment. No manual deployment command is used; the existing GitHub/Vercel integration may automatically deploy a branch push.

An independent re-review was requested but failed due to the review agent's usage limit. Do not treat that attempt as approval of these fixes.

## Merge gates / unverified user play

| Scenario | Current evidence / gate |
| --- | --- |
| A confirm → refresh → logout/login → same furniture/position | **Unverified**, isolated authenticated test required (#158) |
| A edit appears automatically for B | Existing wiring/publication gap; resolve #166, then actual two-account verification |
| A/B same-slot simultaneous edits | Captured version tested locally; actual concurrent SQL/clients **unverified** (#154/#158) |
| B moves/recovers A's own furniture | UI/Demo guard + server definition inspected; authenticated forbidden RPC tests **unverified** |
| Network failure persists no preview | Local rejected-write/zero-write preview tests pass; real disconnected request outcome **unverified** |
| Logout/house change during preview | Client scope reset passes; already-dispatched request/server leave race requires #165 |
| House exit blocks later access/events | **Unverified**, RLS and lock-schedule tests required |
| iOS/Android actual devices, screen reader, touch | **Unverified**; web/renderer results do not cover them |

## Exact follow-up boundary for #154

Keep #154 open: room-wide revision/command scoping; explicit move/remove and guarded undo; source/owner display and preserved personal ownership; conflict refresh/reselect; realtime connection and reconnect recovery (#166); leave/house-switch race authorization (#165). Do not reuse the dirty checkout's partial #154 code as if it had been reviewed or merged. #158 owns the isolated A/B/RLS/reconnect/native evidence. #153/#163 rendering/preview automation passes here, but shared-server acceptance remains gated above. No asset deletion, currency changes, migration rewrite or new product feature belongs in this verification PR.
