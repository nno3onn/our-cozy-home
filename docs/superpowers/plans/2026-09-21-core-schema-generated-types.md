# Core Schema and Generated Database Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the foundational Supabase schema, repeatable global settings seed, SQL constraint checks, and generated TypeScript database boundary for users, houses, memberships, and animals.

**Architecture:** One append-only migration owns five foundational tables, their enums, foreign keys, checks, indexes, RLS enablement, and timestamp trigger. `app_settings` stores server-read configuration as JSON values, with `house_capacity=4` and KST attendance reward `100` seeded idempotently. Database types are generated from the remote project after migration application; domain types remain the screen boundary.

**Tech Stack:** PostgreSQL 15 / Supabase migrations and seed SQL, pgTAP SQL checks, Supabase CLI, TypeScript 6, Expo 57.

**Spec:** `docs/product-spec.md`, `docs/architecture.md`, `.github/codex-issues/002-core-schema-and-generated-types.md`

## Global Constraints

- A user has at most one active membership; historical memberships remain.
- Capacity is server configuration `4`, not the only admission-concurrency defense.
- KST attendance reward configuration is `100`; its ledger/RPC is outside this issue.
- Animal species may repeat across users; each animal has one profile owner.
- Enable RLS on all new tables without a permissive direct-write policy before Issue 010.
- Never commit a secret/service key, database password, or `.env`.
- Existing Demo Mode behavior remains unchanged.

## Review Focus

- A `left` history row allows a new active membership, but a second active membership is rejected.
- Membership and animal foreign keys reject missing parents.
- Invalid statuses, roles, species and empty required names are rejected.
- Re-running settings seed leaves exactly one capacity/reward value.
- Generated types include every foundational table instead of the placeholder record.

---

### Task 1: Add foundational migration and settings seed

**Files:**

- Create: `supabase/migrations/20260921000100_core_schema.sql`
- Modify: `supabase/seed.sql`
- Create: `supabase/tests/001_core_schema_test.sql`

**Interfaces:**

- Consumes: `auth.users(id)` and app configuration keys.
- Produces: `app_settings`, `profiles`, `houses`, `house_memberships`, `animals`; enum values `house_status`, `membership_status`, `house_member_role`, `animal_species`; partial active-membership index.

- [ ] Write SQL checks for table existence, settings values, FK/check failures, duplicate active membership rejection and permitted left history.
- [ ] Run the checks before the migration and observe the missing-table failure.
- [ ] Implement UUID/timestamp tables, nonblank names, owner FKs, nullable house admin until the later creation RPC, enum constraints, audit trigger, partial unique active-membership index and RLS enablement without policies.
- [ ] Seed `house_capacity` and `attendance_daily_reward` with `insert ... on conflict` values `4` and `100`.
- [ ] Apply the append-only migration to the linked remote project and rerun the SQL checks.
- [ ] Commit with `feat: add core Supabase schema`.

### Task 2: Generate and guard the database type boundary

**Files:**

- Modify: `src/types/database.generated.ts`
- Modify: `package.json`
- Modify: `scripts/verify-supabase-foundation.mjs`

**Interfaces:**

- Consumes: linked remote Supabase schema.
- Produces: generated `Database` type and remote/local regeneration commands.

- [ ] Extend the foundation verifier to reject `Record<string, never>` and require all five table names; run it to observe the placeholder failure.
- [ ] Generate types with `supabase gen types typescript --linked`; do not hand-write generated declarations.
- [ ] Change `supabase:types` to regenerate the linked remote type and retain a separately named Docker-local command.
- [ ] Run `npm run supabase:check && npm run typecheck`.
- [ ] Commit with `chore: generate core database types`.

### Task 3: Record evidence and close Issue #3

**Files:**

- Modify: `docs/progress.md`
- Modify: `README.md`
- Modify: `.github/codex-issues/002-core-schema-and-generated-types.md`

**Interfaces:**

- Consumes: applied migration and generated type.
- Produces: reproducible remote instructions and evidence-based close record.

- [ ] Document that remote migration application needs a database password outside the repository; a publishable key is not sufficient.
- [ ] Record local Docker reset/test as separate when unavailable.
- [ ] Run Node 22.14.0 `supabase:check`, lint, typecheck, Jest and Supabase-mode web export.
- [ ] Commit documentation and update/close GitHub Issue #3 only with the exact verification evidence.
