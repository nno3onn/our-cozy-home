# #165 scoped placement / departure verification

## Contract and risk evidence

Base main: `95f031889cdf66bb5c5c94406014c4e7d44faa1f`. Protected PR heads: #164 `92d94f7f9bed03235d4c07c0c1965c9cb06fa67a`, #167 `226f624f905b1f4dccfd6d505613063a0849dd7e`.

Inspection of the legacy placement RPC finds active-house resolution before waiting on the house lock and no membership recheck afterward. A departure committing across that wait is a risk condition; this report does not claim an exploit against production was reproduced. Legacy ownership/version/unique constraints already exist. The new regression schedules test the replacement contract in disposable transactions.

New `place_owned_item_scoped(house,item,slot,expectedVersion,requestKey)` authenticates and validates mandatory inputs; requires READ COMMITTED; takes caller advisory lock (same as leave/create/accept/delete), active profile guard, requested house lock, then fresh active membership check. It never infers a different active house. No membership row lock is acquired: legacy invite takes membership then house and would otherwise form a deadlock cycle. Ordinary callers cannot directly write memberships under existing RLS.

An owned-item row lock, owner/recovery/kind/quantity/slot/memory checks, slot expectedVersion and existing UNIQUE constraints protect the command. Active members may replace shared slots using their own items, preserving displaced assets (explicit user decision). Private per-profile request receipts bind the entire payload; retries return the original result without reapplying it, only after current authority checks. Failed commands roll back receipts and placements together. Legacy RPC execution is revoked and its body also denies; there is no fallback.

## Verification status

- Baseline main: 64 Jest suites / 258 tests passed.
- Local implementation: 64 suites / 261 tests passed; all baseline cases retained, three contract regressions added. Existing placement/offline cases have required scope fields added.
- TypeScript and ESLint passed.
- Demo and Supabase web builds and export verification passed. Supabase build used loopback placeholder credentials: build success does not prove a live backend connection.
- SQL019 and separate-session lock-observed race runner authored; actual isolated CI result pending. Local Docker and psql unavailable.
- Native devices, production accounts and production database not tested or changed. Demo remains memory-only and resets on reload.
- Integration with exact #164/#167 heads pending, including real subscription delivery; mocked realtime tests are not live delivery evidence.

## Rollout and rollback (not executed)

Production migration, deployment and merge require a later approval. Coordinate a maintenance/read-only window with a compatible client release: old clients will fail closed after this migration. Back up and rehearse on staging; retain assets and private request receipts. Verify requested-house denial, leave schedules and auth/RLS before reopening placement. If rollback is needed, revoke the new command and keep placement read-only; do not re-enable the legacy inference RPC, delete receipt history or roll back by dropping user data. Introduce any revised contract through a new reviewed migration.

Branch-specific Vercel deployment guards prevent automatic previews on the independent and integration branches. No production release workflows are dispatched.
