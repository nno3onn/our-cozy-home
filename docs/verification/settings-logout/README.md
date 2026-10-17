# #171 — accessible logout action

Date: 2026-10-17 (Asia/Seoul). Base: latest `origin/main`, `95f031889cdf66bb5c5c94406014c4e7d44faa1f`. Fixed application commit: `14bb2d9cd90eef979cc74ccb1b66e837998cefe2`.

## Problem and narrow fix

Settings placed a logout button inside an informational `ListRow`. Even without an `onPress`, the row rendered a disabled Pressable. Real web accessibility showed the child button inheriting the ancestor's disabled state; clicking through the normal UI was blocked. The same source exists on main and is independent of the placement security work.

Informational rows now use an ordinary View, keeping their trailing controls interactive. Rows with a whole-row action retain their Pressable, accessible action name, minimum height and explicit disabled behavior. The visual layout, AuthProvider, repositories, cache rules, server functions, assets and migrations are unchanged. The branch-specific Vercel guard prevents an automatic deployment.

## Automated verification

- New regression: trailing logout action inside an information row must be enabled and invoke its handler once. Before the fix this failed on `toBeEnabled`; the other two new interaction checks passed. After the fix all checks pass.
- Existing minimum-height/accessible-action test is preserved verbatim. Three additive checks cover enabled trailing actions, one invocation of a whole-row action, and continued blocking of disabled whole-row actions. No original test was removed or excluded.
- Independent full Jest: **64 suites / 261 tests pass**, compared with main's 258 tests. TypeScript and ESLint pass.
- Demo and Supabase clear-cache web builds and export verification pass. Runtime Supabase mode was confirmed in the browser; web compilation is not used as proof of authentication.
- Jest command: `npx jest --watchman=false --runInBand --forceExit`. The installed host Watchman has a missing ICU dylib, so this invocation uses Jest's own file crawler. No repository Jest config, test roots or ignore patterns were changed. The pre-existing force-exit/open-handle notice remains.

## Actual local Supabase browser play

All accounts and data were disposable fixtures in local `cozy-v3-playtest` under the dedicated Colima VM, using only loopback-bound ports. No production credentials, hosted project or operational data were accessed. These are single-agent UI interactions, not a human two-person test.

Independent fix on main (HTTP 127.0.0.1:8087):

1. A signs in and opens Settings: logout is enabled.
2. A clicks logout: the login screen appears. Browser Back does not open A's previous protected screen.
3. B signs in on the same origin: B's animal is the selected status action, rather than A's previous selection. This observes account-switch UI correctness; it does not inspect hidden query cache internals.
4. At 320 × 740, Settings fits without horizontal overflow (scroll width 320). Keyboard Enter on the logout button returns to login. Desktop evidence is 1280 × 720. Temporary viewport override is reset.

Integration follow-up (HTTP 127.0.0.1:8091):

The unchanged #164/#167/#165 aggregate source from `3ca4e29` (same app code as #170 `d8eac55`) was exercised in the separate local-playtest worktree with exactly this ListRow fix applied; the matching additive test file was also used for the combined regression run. No protected PR branch was edited to run this check.

A signs in → chooses furniture → previews → cancels → previews again → explicitly confirms → reloads → logs out through the actual Settings button → signs back in → opens Decorate. The peach cushion is still displayed. A direct local DB assertion compares `owned_item_id`, `slot_id`, and `version` before and after: exactly the same row, slot `floor-accent-left`, version 1. This closes the previously blocked UI logout/re-login persistence check, using the real local Auth and placement backend. It does not change Demo's intentional memory-only reset policy.

Screenshots: `1280-logout-enabled.jpg`, `1280-after-logout.jpg`, `320-logout-enabled.jpg`, `320-keyboard-after-logout.jpg`, `integrated-placement-after-relogin.jpg`. Captured integrated browser warn/error logs were empty.

## Boundaries

- No original dirty checkout, backup, #164 or #167 modifications. Independent #169 and aggregate #170 retain their previous source at this stage.
- No migration additions/edits, production DB changes, merge or remote deployment. This is a Draft UI defect fix.
- The existing remaining gates are not closed by this fix: automatic UI convergence after departure, stale-room presentation during authority loss, actual human two-person testing, physical iOS/Android and device background/resume.
- Native was not rerun for this UI-only change. Earlier native preparation was blocked by the Xcode/iOS runtime mismatch; no native success is claimed.

## Final combined regression and cleanup

The aggregate with this fix passes TypeScript, ESLint, web export verification, and all **69 suites / 300 Jest tests** (previous 297 retained, three added). This is a local result and is distinct from GitHub Actions on the independent PR. PR #170's prior unchanged head `cadf00a1e2a416c83a5f787c07ef5c945d4f3013` also has a successful [Database release gate](https://github.com/nno3onn/our-cozy-home/actions/runs/38990326362/job/117271080674).

After browser verification the helper successfully removed both test users, their one house and all three fixture items. The dedicated local stack and Colima VM were stopped; local static servers and temporary browser tabs were closed. No user assets or operational database were involved.
