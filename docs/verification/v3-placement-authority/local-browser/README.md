# Local Docker and real Supabase browser verification

Date: 2026-10-17 (Asia/Seoul). Tested application SHA: `d8eac55cad0d92a4c82b6923bba36bfe4eb47f32`, integration-only Draft #170. No application or migration source was changed for this test. This is agent-operated browser play, not human two-person testing.

## Isolation and reproducibility

Dedicated worktree: `codex/v3-local-playtest`. Original dirty checkout and backup were read only; all 549 manifest files still match, original HEAD is `76286654a1d701086a5f359c5d646481e8da5b9a`, with its 210 existing porcelain entries. Protected #164/#167 branches were not edited.

Installed local Homebrew Colima/Docker/libpq and CocoaPods, plus private pinned Supabase CLI 2.118.0. No shell startup files or default Docker context were changed. Colima profile `cozy-v3` uses 3 CPUs / 4 GiB RAM / 20 GiB disk. Its only explicit writable mount is the isolated playtest worktree. Explicit `DOCKER_HOST=unix:///Users/nno3onn/.colima/cozy-v3/docker.sock` selects this VM.

The ignored `.local-playtest/supabase/config.toml` uses project ID `cozy-v3-playtest`; migrations/seed/tests link to this worktree, with no remote project link. A custom Docker bridge `cozy-v3-loopback` sets `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. Start with `supabase start --network-id cozy-v3-loopback --workdir .local-playtest -x studio,imgproxy,logflare,vector,edge-runtime,supavisor,postgres-meta`. Host `lsof` confirmed API 54321 and DB 54322 listen on 127.0.0.1, and Docker reports loopback bindings for all published stack ports. The initial default network was stopped with data backup and replaced before browser fixtures were created.

`scripts/prepare-local-room-playtest.mjs` must run from `.local-playtest`, with the pinned CLI on PATH and `ROOM_PLACEMENT_DISPOSABLE_DB=1`. It rejects a different project or non-loopback URLs, creates only disposable dummy A/B users and three owned cushions, and keeps local test credentials in ignored mode-0600 `fixture.json`. Service credentials are never exported to the browser or saved in the fixture. Use its `--cleanup` option to remove its exact fixtures. Do not commit the private directory or print its credentials. Archive a cleaned fixture file before deliberately preparing a new run; the helper refuses accidental overwrite.

The real Supabase web export used only the local public API URL/key, with `expo export --platform web --clear`. A first cached export unexpectedly displayed Demo; clearing Metro cache produced the verified Supabase sign-in/settings screens. Build success alone is not a runtime-mode assertion. `scripts/serve-local-room-playtest.mjs 8087 8088 8090` binds static files to loopback only, with separate origins for A, B and a fresh A session.

## Actual results

| Check | Observed result |
| --- | --- |
| Full local SQL/RLS | 23 files / 291 assertions pass |
| Separate SQL-session races | All eight groups pass, including place-first/leave-first, old-house request, slot version conflict, foreign item denial and retry atomicity |
| Local Auth/REST/WebSocket harness | All six groups pass; actual PostgreSQL subscription and INSERT/UPDATE, fresh REST, API logout/re-login/refresh persistence, immediate leave and valid-JWT denial |
| A/B browser login | Separate dummy accounts, same two-member house, distinct browser origins |
| Preview / cancel | Both can preview an empty slot; direct DB query remains zero placements. A cancels, returns to empty-slot state, previews again and explicitly confirms |
| Stale preview | B confirms the version captured before A's write; friendly conflict message, latest A cushion restored, no silent overwrite |
| Allowed shared replacement | B re-previews with current version and replaces using B's own mint cushion; A's open screen reflects mint without reload; A inventory still contains only its own two items |
| Fresh browser session | A signs in on a third origin with no prior session; server-confirmed mint is present. B reload and subsequent authoritative reads succeed |
| 320 × 740 | Actual Supabase screen; document width/height and scroll width/height are 320/740. Room and internally scrolling inventory remain visible. Desktop screenshots are 1280 × 720 |
| Departure while preview open | A places its peach cushion, opens a star preview, then leaves via a second authenticated A UI session. Old A confirms the retained preview; server rejects it. Direct DB: zero house placements, all three owned items retained, one active member |
| B after departure | B fresh reload shows one member, no departed A animal/cushion, and B's own inventory. Automatic removal delivery was not established in this observation; do not count the reload as Realtime proof |
| Browser diagnostics | Captured A/B error/warn logs were empty |

Screenshots: `b-stale-preview-conflict.jpg`, `a-sees-b-confirmed.jpg`, `320-fresh-a-server-state.jpg`, `a-departed-request-rejected.jpg`, `b-after-a-departure-fresh-read.jpg`, `settings-logout-disabled.jpg`.

## Defects and remaining verification

- **#171: existing settings logout button is inaccessible/disabled.** Its own DOM `aria-disabled` is null but its parent ListRow is `aria-disabled=true`. Main contains the same disabled parent and trailing button structure. No forced click, auth bypass or protected PR edit was used. API sign-out/re-login passed; the full UI logout/re-login sequence remains blocked and must not be reported complete.
- During departure rejection A can briefly retain cached room/inventory UI alongside the failure message, while home reports no current house. The server refused the write and the DB has no placement. #154/#166 follow-up should verify permission-loss cache reset, removal reconciliation, and bounded UI convergence; successful API denial is not proof that stale UI is cleared.
- This browser run confirms an A/B replacement reaches the other open screen. It does not establish a latency guarantee, startup WAL readiness, offline browser transport retry, or automatic departure/removal convergence. The SQL/API harness separately covers retry and authority schedules.
- iOS attempt: CocoaPods 1.17 succeeds (116 pods) in an isolated ASCII-path source copy after the original Korean-path Ruby encoding failure. Xcode build cannot find an eligible simulator destination: Xcode reports required iOS 26.5 platform unavailable, while installed simulator runtime is iOS 18.5. Both specific-device and generic simulator destinations fail before compiling the app. Native app execution, physical iOS/Android, and background/resume remain unverified. No runtime download or device success is implied.
- No production DB access, remote deployment or merge occurred. #170 remains Draft and is an integration verification vehicle, not a merge candidate. Independent security review remains in #169. Human two-person staging/device verification and #171 resolution are still required before claiming full playability.

## Final local regression and cleanup

TypeScript and ESLint exit 0. Full Jest: 69 suites / 297 tests pass, no tests removed (existing force-exit/open-handle notice remains). The real local Supabase clear-cache web export and `verify:web:export` pass. Demo browser evidence remains separately recorded in `../browser-demo/`; it is not rerun or relabeled as server evidence here.

The two disposable browser fixture Auth users, their one house and three items were cleaned successfully. Fixture passwords were removed from the ignored private manifest. Local stack stop retains disposable volumes, and the dedicated Colima VM is stopped after verification to release RAM/CPU. Recreate `cozy-v3-loopback` with its loopback binding option if the network is absent before restarting. The reusable scripts require the same isolated configuration and explicit disposable authorization.
