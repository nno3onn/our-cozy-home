# Curtain installation fix — 2026-10-15

The sunny room PNG already contained curtains, while the window slot rendered an additional small sprite using floor coordinates. This produced duplicate curtains floating in the middle of the window.

- Preserve the original room asset and default interior. Use a sibling generated edit with only the curtains/ties removed when a valid curtain occupies the window slot.
- Fit curtain rods/hem optical anchors to the original 1536×1024 window using the exact centered `cover` transform. Floor/animal transforms and all other furniture retain their existing behavior.
- Calibrate the five curtain PNGs' different transparent padding. Cafe curtains end at the sill; full curtains reach the original curtain hem. Only installed curtain images use the fitted stretch frame; shop thumbnails still use contain.
- Preview cancellation restores the original background; confirmed placement continues using the existing repository contract. No DB, migration, ownership, price, economy or persisted slot changes.

Based on PR #164 head `92d94f7`; original dirty checkout, backup, PR #164 and #167 were not changed. This branch is a dependent visual fix, not a replacement for their server acceptance gates.

Verification: 68 suites / 287 Jest tests pass (all 284 existing tests retained, 3 new parameterized cases covering every curtain at 320×320 / 1280×720 / 320×600); TypeScript, ESLint, Demo web build and export validation pass. Initial tests reproduced the missing backdrop replacement. A test fixture initially used an asset filename instead of catalog ID; corrected to `curtain-ribbon-pair` before final verification.

Actual Demo browser: purchase ribbon curtain with Demo coins, select/preview/cancel/re-preview/confirm at 320×800, verify 1280×900, no double curtains, rod aligned to window top. Screenshots: [320 preview](320-preview.png), [1280 confirmed](1280-confirmed.png). Original localhost:8081 was left intact; verification ran on localhost:8084. Supabase live play and native devices were not tested for this visual-only fix.

The bare-window image was edited from the existing room with the built-in image generation tool, preserving the reference's camera, window geometry, furniture, rug, floor and palette as closely as possible. Original and generated assets remain separate files.
