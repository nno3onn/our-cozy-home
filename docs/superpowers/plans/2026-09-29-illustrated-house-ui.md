# Illustrated House UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 참고 이미지 수준의 따뜻한 생활 게임 UI를 홈, 꾸미기, 상점, 추억, 집 관리와 보상 흐름에 일관되게 적용한다.

**Architecture:** 기존 repository와 TanStack Query의 서버 snapshot은 그대로 두고, `illustrated-ui`의 scene/chrome/catalog/overlay component를 새 presentation 계층으로 둔다. room·catalog model의 asset key가 같은 renderer를 사용하도록 연결하며, 자산이 없는 항목은 명시적인 placeholder 상태를 보존한다.

**Tech Stack:** Expo Router, React Native + React Native Web, TypeScript, React Native Skia, Reanimated, Gesture Handler, Zustand, TanStack Query, Jest + React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-29-illustrated-house-ui-design.md`

## Global Constraints

- 집 정원 4명, 사용자당 활성 집 하나, 개인 소유권, memory viewer snapshot, 서버 확정 mutation을 바꾸지 않는다.
- Demo Mode와 Supabase Mode는 동일한 component/repository contract를 사용한다.
- 최종 자산이 아닌 항목은 `assetStatus: 'placeholder'`를 유지하고 문서에서 숨기지 않는다.
- 320px 폭에서도 네 동물 target과 name ribbon은 겹치지 않고 모든 press target은 최소 44px이다.
- offline에서는 마지막 scene snapshot은 보이지만 구매·입주·행동·배치 확정 명령은 차단한다.
- reduced motion에서는 반복 bounce, 큰 scale reveal을 중지하고 상태 변화만 즉시 반영한다.
- 새 서버 schema, RPC, RLS, repository method를 이 UI 계획에서 추가하지 않는다.

## Review Focus

- 4명 방: 320px에서 actor hit target·이름 ribbon이 겹치지 않는 것을 Task 3 layout test로 고정한다.
- 동일 상품: 모든 shop item이 thumb와 room renderer에서 같은 asset key를 쓰는 것을 Task 2 catalog renderer test로 고정한다.
- 타인 가구: owner label만 보이고 placement control이 열리지 않는 것을 Task 5 test로 고정한다.
- archive 추억: 현재 앨범과 개인 보관함이 섞이지 않고 photo preview를 권한 밖으로 추정하지 않는 것을 Task 6 test로 고정한다.
- 모션/오프라인: reduced-motion/offline mutation 차단이 새 visual component에도 유지되는 것을 Task 8 integration test로 고정한다.

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/theme/illustratedTokens.ts` | scene/ink/light/shadow/type/radius의 시각 토큰 |
| `src/features/illustrated-ui/scene/*` | room backdrop, sprite metadata, animal/furniture renderer |
| `src/features/illustrated-ui/chrome/*` | 집 header, member avatars, coin pill, game navigation |
| `src/features/illustrated-ui/catalog/*` | item thumbnail, category chip, two-column item card |
| `src/features/illustrated-ui/overlays/*` | sheet/modal 공통 frame와 reward presentation |
| `assets/illustrated/*` | 투명 room/animal/furniture/ui 자산과 manifest |
| `src/features/room/*` | 실제 홈 room stage와 동물 detail composition |
| `src/features/decorate/*`, `src/features/shop/*` | room-preserving decorate tray와 실제 상품 UI |
| `src/features/memories/*`, `src/features/house/*` | scrapbook, invite, attendance/reward, entry UI |

### Task 1: Illustrated visual token system and primitive chrome

**Files:**
- Create: `src/theme/illustratedTokens.ts`
- Create: `src/features/illustrated-ui/chrome/CoinPill.tsx`, `MemberAvatarRow.tsx`, `GameIconButton.tsx`
- Create: `src/features/illustrated-ui/chrome/__tests__/MemberAvatarRow.test.tsx`
- Modify: `src/theme/tokens.ts`, `src/components/ui/AppButton.tsx`, `src/components/ui/Panel.tsx`

**Interfaces:**
- Produces `illustratedColors`, `illustratedRadii`, `illustratedElevation` and `MemberAvatarRow({ members, capacity, currentUserId, onInvite })`.
- Consumes existing `Member`, house capacity and `AppButton` accessibility contract.

- [ ] **Step 1: Write failing primitive tests**

Assert four avatar positions are rendered, non-admin users have no invite action, admins with capacity render one labelled invite action, and `CoinPill` exposes an accessible balance.

- [ ] **Step 2: Run focused test to verify it fails**

Run: `npm test -- src/features/illustrated-ui/chrome/__tests__/MemberAvatarRow.test.tsx --runInBand`

Expected: FAIL because illustrated primitives do not exist.

- [ ] **Step 3: Implement semantic visual primitives**

Define the palette in `illustratedTokens.ts`. Make reusable buttons/pills use minimum 44px press regions and use labels rather than emoji-only semantics.

- [ ] **Step 4: Run focused tests and lint**

Run: `npm test -- src/features/illustrated-ui/chrome/__tests__/MemberAvatarRow.test.tsx --runInBand && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme src/features/illustrated-ui/chrome src/components/ui
git commit -m "feat(ui): add illustrated visual primitives"
```

### Task 2: Asset manifest and reusable thumbnail/furniture renderer

**Files:**
- Create: `src/features/illustrated-ui/scene/assetManifest.ts`, `FurnitureSprite.tsx`, `ItemThumbnail.tsx`
- Create: `src/features/illustrated-ui/scene/__tests__/assetManifest.test.ts`
- Create: `assets/illustrated/README.md`, `assets/illustrated/rooms/sunny-room.*`, `assets/illustrated/animals/rabbit.*`, `assets/illustrated/animals/cat.*`, `assets/illustrated/furniture/*`
- Modify: `src/catalog/items.ts`, `src/features/dev/AssetGalleryScreen.tsx`, `docs/progress.md`

**Interfaces:**
- Produces `getIllustratedAsset(key: string): IllustratedAsset | null`, `FurnitureSprite({ itemDefinitionId, size })`, and `ItemThumbnail({ itemDefinitionId, size })`.
- Consumes `ItemDefinition.thumbnailKey`, `roomAssetKey`, `assetStatus`.

- [ ] **Step 1: Write failing asset mapping tests**

Assert the rabbit/cat and pilot cushion/table/plant final keys resolve, every catalog item has a thumb renderer fallback, and a final item uses the identical underlying key in thumbnail and furniture renderer.

- [ ] **Step 2: Run focused test to verify it fails**

Run: `npm test -- src/features/illustrated-ui/scene/__tests__/assetManifest.test.ts --runInBand`

Expected: FAIL because the manifest and renderers do not exist.

- [ ] **Step 3: Generate and add pilot assets, then implement manifest renderers**

Create original transparent assets with a consistent 3/4 room perspective; never recreate reference-image characters or pixels. Keep non-pilot items visibly marked `placeholder` in the development gallery and progress document.

- [ ] **Step 4: Run asset/catalog regression**

Run: `npm test -- src/features/illustrated-ui/scene src/catalog src/features/dev --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/illustrated src/features/illustrated-ui/scene src/catalog/items.ts src/features/dev docs/progress.md
git commit -m "feat(ui): add illustrated room asset pipeline"
```

### Task 3: Layered room scene and animal actor art

**Files:**
- Create: `src/features/illustrated-ui/scene/RoomBackdrop.tsx`, `AnimalSprite.tsx`, `RoomScene.tsx`
- Create: `src/features/illustrated-ui/scene/__tests__/RoomScene.test.tsx`
- Modify: `src/features/room/components/RoomCanvas.tsx`, `RoomCanvas.web.tsx`, `AnimalActor.tsx`, `src/game/room/roomLayout.ts`
- Modify: `src/game/room/__tests__/roomLayout.test.ts`

**Interfaces:**
- Produces `RoomScene({ animals, members, placements, isActive, onSelectAnimal, onOpenMemory })`.
- Consumes `HomeSnapshot` scene inputs and existing 1000×1000 anchors.

- [ ] **Step 1: Write failing room scene tests**

Assert four animal buttons have unique labels/rectangles at 320px, memory furniture opens its memory ID, actor sprite uses owner point color ribbon but does not expose an online status, and a final furniture key renders its `FurnitureSprite`.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/illustrated-ui/scene/__tests__/RoomScene.test.tsx src/game/room/__tests__/roomLayout.test.ts --runInBand`

Expected: FAIL because `RoomScene` does not exist.

- [ ] **Step 3: Implement background layers and actor/furniture composition**

Preserve depth ordering from actor foot position. Mobile is width-led; desktop scene size is clamped by viewport height so all four animals remain visible.

- [ ] **Step 4: Run scene regression and demo web build**

Run: `npm test -- src/features/illustrated-ui/scene src/features/room src/game/room --runInBand && EXPO_PUBLIC_APP_MODE=demo npm run build:web`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/illustrated-ui/scene src/features/room src/game/room
git commit -m "feat(ui): render illustrated shared room"
```

### Task 4: Home game chrome and animal detail sheet

**Files:**
- Create: `src/features/illustrated-ui/chrome/HouseGameHeader.tsx`, `GameTabBar.tsx`
- Modify: `src/features/house-shell/components/HouseGameShell.tsx`, `HouseChrome.tsx`, `HouseOverlay.tsx`
- Modify: `src/features/room/components/AnimalDetailSheet.tsx`, `HomePrompt.tsx`, `src/features/room/screens/HomeScreen.tsx`
- Modify: `src/features/room/components/__tests__/AnimalDetailSheet.test.tsx`, `src/features/room/screens/__tests__/HomeScreen.test.tsx`

**Interfaces:**
- Consumes Task 1 chrome and Task 3 `RoomScene`.
- Preserves `AnimalDetailSheet({ animal, owner, disabled, onAction })` action contract.

- [ ] **Step 1: Write failing home/sheet presentation tests**

Assert home uses illustrated header, member row and tab bar; pressing an animal opens a sheet that retains the room behind it; sheet action invokes the existing mutation ID; offline/pending disables actions; dismiss restores the actor control.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/room/components/__tests__/AnimalDetailSheet.test.tsx src/features/room/screens/__tests__/HomeScreen.test.tsx --runInBand`

Expected: FAIL against the prior shell composition.

- [ ] **Step 3: Compose game chrome and art-directed sheet**

Use the animal sprite crossing the sheet edge, clear owner text, mood/state rows and three labelled action cards. Do not issue mutations for opening/closing animation.

- [ ] **Step 4: Run home regression**

Run: `npm test -- src/features/house-shell src/features/room --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/illustrated-ui/chrome src/features/house-shell src/features/room
git commit -m "feat(ui): compose illustrated home and animal sheet"
```

### Task 5: Room-preserving decorate and illustrated shop

**Files:**
- Create: `src/features/illustrated-ui/catalog/CategoryChips.tsx`, `ShopItemCard.tsx`
- Modify: `src/features/decorate/components/DecorateTray.tsx`, `src/features/decorate/screens/DecorateScreen.tsx`
- Modify: `src/features/shop/screens/ShopScreen.tsx`
- Modify: `src/features/decorate/components/__tests__/DecorateTray.test.tsx`, `src/features/decorate/screens/__tests__/DecorateScreen.test.tsx`, `src/features/shop/screens/__tests__/ShopScreen.test.tsx`

**Interfaces:**
- Consumes Task 2 `ItemThumbnail` and Task 3 room scene.
- Preserves `usePlaceItem` expected-version mutation and shop purchase/recovery behavior.

- [ ] **Step 1: Write failing decorate/shop tests**

Assert a selected owned item uses the shared thumbnail, appears as a ghost/highlight in the room, and placement preserves expected version. Assert other-member items show owner but no placement control. Assert shop category switching shows 2-column cards, price/owned state and offline-disabled purchase.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/decorate src/features/shop --runInBand`

Expected: FAIL because illustrated item components do not exist.

- [ ] **Step 3: Implement bottom inventory tray and shop grid**

Keep shop purchase behavior in the existing route; the decorate tray may navigate to it but must not duplicate purchase state. Use final asset thumbnails when available and explicit placeholder marks otherwise.

- [ ] **Step 4: Run placement/shop regression**

Run: `npm test -- src/features/decorate src/features/shop src/catalog --runInBand && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/illustrated-ui/catalog src/features/decorate src/features/shop
git commit -m "feat(ui): add illustrated decorate and shop views"
```

### Task 6: Scrapbook memories and reward presentations

**Files:**
- Create: `src/features/illustrated-ui/overlays/RewardModal.tsx`, `src/features/illustrated-ui/scrapbook/MemoryPhotoCard.tsx`, `ParticipantRow.tsx`
- Modify: `src/features/memories/components/ScrapbookMemoryCard.tsx`, `MemoryFurnitureCompletionModal.tsx`
- Modify: `src/features/memories/screens/MemoriesScreen.tsx`, `MemoryComposerScreen.tsx`, `MemoryDetailScreen.tsx`
- Modify: `src/features/memories/components/__tests__/ScrapbookMemoryCard.test.tsx`, `src/features/memories/screens/__tests__/MemoriesScreen.test.tsx`, `MemoryComposerScreen.test.tsx`

**Interfaces:**
- Consumes existing current/archive memory queries and contribution/share result.
- Produces `MemoryPhotoCard({ memory, scope, onPress })` and reusable `RewardModal`.

- [ ] **Step 1: Write failing memory/reward tests**

Assert current memories are month-grouped photo cards with participants/date, archived cards only appear under `개인 보관함`, and original deletion/unavailable image metadata produces an inaccessible/missing-photo state instead of a preview. Assert reward modal does not open without a server completion key.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/memories --runInBand`

Expected: FAIL because photo/reward presentations do not exist.

- [ ] **Step 3: Implement scrapbook and server-gated reward presentation**

Keep the completion modal dormant until the existing server response is extended; do not fabricate furniture placement. Preserve archive cutoff copy and viewer authority in detail routes.

- [ ] **Step 4: Run memory regression**

Run: `npm test -- src/features/memories --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/illustrated-ui/overlays src/features/illustrated-ui/scrapbook src/features/memories
git commit -m "feat(ui): present memories as illustrated scrapbook"
```

### Task 7: Illustrated entry, invite, attendance, and settings screens

**Files:**
- Create: `src/features/illustrated-ui/overlays/InviteCard.tsx`, `AttendanceRewardCard.tsx`
- Modify: `src/features/house/screens/HouseCreateScreen.tsx`, `HouseEntryChoiceScreen.tsx`, `InviteManagerScreen.tsx`, `InviteAcceptanceControls.tsx`, `HouseLeaveControls.tsx`
- Modify: `src/features/settings/SettingsScreen.tsx`, relevant auth/onboarding screens
- Modify: `src/features/house/screens/__tests__/*.test.tsx`, `src/features/settings/__tests__/SettingsScreen.test.tsx`, auth screen tests

**Interfaces:**
- Consumes Task 1 primitives and existing invite/attendance/account actions.
- Preserves token privacy, invite preview minimum fields, and server-confirmed attendance result.

- [ ] **Step 1: Write failing entry/overlay tests**

Assert invite preview only shows house/inviter/current member count, full house uses the existing blocked state, invite action remains labelled, and attendance reward shows the server-returned 100 coin result only once. Assert settings destructive actions retain clear confirmation controls.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/house src/features/settings src/auth --runInBand`

Expected: FAIL against the current generic panels.

- [ ] **Step 3: Apply shared illustrated entry/reward components**

Use house/sun/reward art without logging tokens or including private memory content. Keep account deletion and leaving-house language distinct from game rewards.

- [ ] **Step 4: Run entry/settings regression**

Run: `npm test -- src/features/house src/features/settings src/auth --runInBand && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/illustrated-ui/overlays src/features/house src/features/settings src/auth
git commit -m "feat(ui): style house entry and reward flows"
```

### Task 8: Responsive integration, accessibility, and visual verification

**Files:**
- Modify: `docs/decisions.md`, `docs/progress.md`, `README.md`
- Modify: affected test files from Tasks 1–7

**Interfaces:**
- Consumes all illustrated presentation components without changing repository/RPC interfaces.
- Produces verified demo web build and accurate asset/real-device status documentation.

- [ ] **Step 1: Write failing integration tests**

Assert home → animal sheet → dismiss keeps room snapshot, home → decorate preserves selected placement, shop → inventory uses one item key, archive memory remains visually separated, and reduced-motion/offline state blocks mutations while keeping scene content visible.

- [ ] **Step 2: Run integration tests to verify they fail**

Run: `npm test -- src/features/room src/features/decorate src/features/shop src/features/memories --runInBand`

Expected: FAIL until all illustrated interfaces are composed.

- [ ] **Step 3: Complete responsive/accessibility integration and update documentation**

Test 320px, 390×844, 1280×720, focus/dismiss flow, keyboard-safe text entry and reduced motion. Record only generated pilot assets as final; leave all other catalog assets explicitly placeholder.

- [ ] **Step 4: Run complete automated verification**

Run: `npm test -- --runInBand --forceExit && npm run typecheck && npm run lint && EXPO_PUBLIC_APP_MODE=demo npm run build:web && npm run verify:web:export`

Expected: all commands exit 0.

- [ ] **Step 5: Run browser checks and commit**

Run `npm run preview:web` and verify `/`, `/decorate`, `/shop`, `/memories`, `/house/invite` at 390×844 and 1280×720. Record browser-only results and any unverified native/Supabase constraints.

```bash
git add docs README.md src
git commit -m "docs(ui): record illustrated UI verification"
```

## Plan Self-Review

- Spec coverage: Tasks 1–3 cover art tokens, pilot assets and layered room; Tasks 4–7 cover all requested user-facing flows; Task 8 covers responsive/accessibility/documentation verification.
- Type consistency: `ItemThumbnail`/`FurnitureSprite` consume existing item definition IDs; room composition only consumes existing snapshot fields; mutations stay in existing hooks.
- Review focus coverage: Tasks 2, 3, 5, 6 and 8 each include the five identified high-risk input cases.
- Scope: server/RPC work is excluded, and the asset rollout explicitly distinguishes pilot final art from remaining placeholders.
