# Short invite code rollout (#176)

The original 8-character code was displayed and accepted by the entry form, but the server
hashed every input as a 64-character link token. The code therefore always previewed as
invalid. The link token remains the stronger, anonymous-preview credential.

This change allows codes only for authenticated users. Preview and acceptance use the same
invite row, expiry, cancellation, reissue, four-member limit and idempotent request key as
links. A private per-account counter permits ten short-code lookups in a one-hour
window. Failed lookups return no house metadata. The counter is not exposed to client table
queries or direct RPC calls. Full links retain their existing anonymous preview behavior.

Apply the **new** migration before releasing the matching client. No existing invite or
personal asset is rewritten. Production migration and deployment require separate approval.
If the code path must be disabled after deployment, ship a new migration restoring link-only
lookup while leaving the counter table for audit and later cleanup; do not edit or remove an
already applied migration. The client can meanwhile direct users to full links.

Verification: isolated local Supabase SQL assertions cover anonymous denial, successful
code preview/join, link compatibility, request retry, invalid codes and per-account limit.
Actual two-account browser, native devices and production rollout are separate checks.
