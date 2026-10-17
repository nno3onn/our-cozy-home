# Follow-up: actual Demo browser interaction

Source SHA: `e519988c9e4907801fdfb6cd9205409343ef33f7` (integration-only Draft PR #170). App code was not changed for this verification.

Build: `EXPO_PUBLIC_APP_MODE=demo npm run build:web`, then `npm run verify:web:export`: pass. Local static preview: http://localhost:8086. Original localhost:8081 and original dirty checkout remain untouched. No Supabase/production credentials or writes were used.

## Browser-observed results

These are agent-driven interactions through the real in-app browser, not Jest or human two-person play.

- 1280×800: initial peach cushion → select mint cushion → preview. The room displays mint and the explicit preview label/cancel/confirm controls. Cancel restores peach and its placement label. A second preview followed by explicit confirmation changes the placement label to mint.
- 320×740: after explicit Demo reset in Settings and its confirmation, peach is restored. Select the empty right slot → preview mint alongside peach → cancel restores the empty-slot label → preview again → confirm. Mint is displayed in the right slot and peach remains in the left slot.
- Already placed mint does not offer another placement/duplicate; the preview button is disabled after confirmation.
- Measured outer document widths/heights: 1280×800 at 1280×800; 320×740 at 320×740. No outer-document horizontal overflow. The inventory panel scrolls internally to expose additional controls; this is not a claim that every inventory control fits without internal scrolling.
- Captured browser warn/error logs after the flows: empty.
- Temporary viewport override was reset afterward.

## Reload / fresh-session limitation

Calling the in-app browser reload API retained the mint label in this browser session. This is recorded as an observation, not proof of database persistence or of a fresh JavaScript process. Opening a new direct `/decorate` test tab was blocked with `ERR_BLOCKED_BY_CLIENT`; the empty test tab was closed, and no security bypass or alternative browser mechanism was attempted. Full fresh-session initialization/reset therefore remains unverified through this browser tool. The visible Demo reset → confirmation restored the seed as expected.

No Demo storage policy was changed. Demo still uses an in-memory cloned seed in its repository. A browser-tool reload observation must not be used to claim Supabase persistence or to change the intentional reset policy.

## Evidence

- `1280-preview.jpg`: explicit preview and controls.
- `1280-confirmed.jpg`: mint after confirmation.
- `320-preview.jpg`: empty right slot preview, peach preserved, cancel/confirm visible.
- `320-right-confirmed.jpg`: right slot confirmed while existing peach remains.
- `320-confirmed.jpg`: earlier narrow view of the left-slot confirmation.

Still unverified: actual human two-person browser play with Supabase, browser-level fresh-session server persistence, hosted staging, physical iOS/Android and device background/resume. Existing isolated Auth/REST/WebSocket evidence remains separate from this Demo browser check. No deployment, production migration or merge was performed.
