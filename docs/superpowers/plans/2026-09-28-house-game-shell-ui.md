# House Game Shell UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방을 중심으로 하는 게임형 셸에서 홈, 동물 Bottom Sheet, 꾸미기 보관함, 스크랩북 추억 앨범을 동작하게 만든다.

**Architecture:** `HouseGameShell`은 layout과 transient overlay state만 소유하고, 기존 TanStack Query home/memory hooks와 repository mutation을 그대로 사용한다. `RoomCanvas`를 주요 화면의 공통 무대로 승격하고, 탭 route는 선택된 화면에 맞는 overlay/tray 또는 앨범을 렌더한다. 서버 스키마와 게임 규칙은 변경하지 않는다.

**Tech Stack:** Expo Router, React Native/React Native Web, TypeScript, Zustand, TanStack Query, Reanimated, Jest + React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-28-house-game-shell-ui-design.md`

## Global Constraints

- Demo Mode와 Supabase Mode는 같은 component/repository contract를 사용한다.
- 집 정원 4명, 사용자당 활성 집 하나, 개인 소유권, 추억 viewer 권한, 서버 확정 mutation을 변경하지 않는다.
- Offline에서는 마지막 snapshot을 읽기 전용으로 보이고 출석·동물 행동·배치·구매 확정 명령을 막는다.
- 아이콘만 있는 control에는 접근 가능한 이름, 모든 press target에는 최소 44px 크기를 제공한다.
- 기존 `useReducedMotion` 동작을 존중하며 reduced motion에서 반복/큰 이동 애니메이션을 만들지 않는다.
- 새 UI 라이브러리를 추가하지 않는다. 첫 버전의 도형·에셋은 placeholder임을 유지한다.

## Review Focus

- 320px 모바일 폭에서 네 동물의 실제 press target과 이름표가 겹치지 않는다. Task 2 layout test로 고정한다.
- Sheet/tray가 닫힐 때 focus가 기존 actor/button으로 돌아간다. Task 3 overlay tests로 고정한다.
- 오프라인 snapshot에서는 선택은 보이지만 mutation 요청을 보내지 않는다. Task 3·4 tests로 고정한다.
- 다른 사용자의 가구에는 소유자 정보만 표시하고 이동/배치 제어를 열지 않는다. Task 4 tests로 고정한다.
- 탈퇴자 개인 보관함과 현재 공동 앨범이 섞이지 않는다. Task 5 scope separation test로 고정한다.

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/theme/tokens.ts` | game shell surface, shadow, radius, viewport tokens |
| `src/features/house-shell/store/useHouseShellStore.ts` | overlay, 선택 동물, 꾸미기 segment의 transient Zustand state |
| `src/features/house-shell/components/HouseGameShell.tsx` | mobile/desktop shell, chrome, room stage, navigation slot |
| `src/features/house-shell/components/HouseChrome.tsx` | house name, coin, settings, 4개 member/invite slot |
| `src/features/house-shell/components/HouseOverlay.tsx` | scrim, Bottom Sheet/modal dismiss와 focus contract |
| `src/features/room/components/AnimalDetailSheet.tsx` | 동물 상태/행동/버릇과 기존 action callback |
| `src/features/room/components/HomePrompt.tsx` | 현재 동물 상태의 한 줄 action entry |
| `src/features/decorate/components/DecorateTray.tsx` | RoomCanvas 위 inventory/shop segment와 소유자 표식 |
| `src/features/memories/components/ScrapbookMemoryCard.tsx` | 월별 polaroid memory card |
| `src/features/memories/components/MemoryFurnitureCompletionModal.tsx` | 가구 완성 축하 presentation |

### Task 1: Game-shell tokens and transient state

**Files:**
- Modify: `src/theme/tokens.ts`
- Create: `src/features/house-shell/store/useHouseShellStore.ts`
- Create: `src/features/house-shell/store/__tests__/useHouseShellStore.test.ts`

**Interfaces:**
- Produces: `HouseOverlay = 'none' | 'animal' | 'decorate' | 'attendance' | 'invite' | 'memory-complete'`.
- Produces: `useHouseShellStore` with `overlay`, `selectedAnimalId`, `decorateSegment`, `openAnimal(id)`, `openOverlay(overlay)`, `closeOverlay()`, `setDecorateSegment(segment)`.

- [ ] **Step 1: Write the failing store tests**

Test `openAnimal('animal-a')` selects the animal and opens `animal`; `closeOverlay()` clears only overlay; `setDecorateSegment('shop')` persists only the segment.

- [ ] **Step 2: Run the store test to verify it fails**

Run: `npm test -- src/features/house-shell/store/__tests__/useHouseShellStore.test.ts --runInBand`

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement tokens and `useHouseShellStore`**

Keep only UI state in Zustand. Never copy `HomeSnapshot`, coin, membership, memory, or inventory data into this store.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/features/house-shell/store/__tests__/useHouseShellStore.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts src/features/house-shell/store
git commit -m "feat(ui): add house shell state"
```

### Task 2: Responsive room stage and game-shell chrome

**Files:**
- Create: `src/features/house-shell/components/HouseGameShell.tsx`
- Create: `src/features/house-shell/components/HouseChrome.tsx`
- Create: `src/features/house-shell/components/__tests__/HouseGameShell.test.tsx`
- Modify: `src/game/room/roomLayout.ts`, `src/game/room/constants.ts`, `src/game/room/__tests__/roomLayout.test.ts`
- Modify: `src/features/room/components/AnimalActor.tsx`, `src/features/room/components/RoomCanvas.web.tsx`

**Interfaces:**
- Consumes: `HomeSnapshot`, `HouseOverlay`, `useHouseShellStore`.
- Produces: `HouseGameShell({ snapshot, activeTab, onOpenSettings, onOpenInvite, children })`.
- Produces: `HouseChrome({ house, members, currentUserId, coinBalance, onOpenSettings, onOpenInvite })`.
- Produces: `getAnimalHitTargets(count, viewport): Rect[]` with non-overlapping targets at 320px and desktop widths.

- [ ] **Step 1: Write failing layout and shell tests**

Assert four `getAnimalHitTargets` rectangles never intersect at a 320px room. Assert the shell renders four member slots, accessible `2 / 4명` text, and an invite control only for current admin with free slots; desktop width exposes desktop chrome/rail semantics.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/game/room/__tests__/roomLayout.test.ts src/features/house-shell/components/__tests__/HouseGameShell.test.tsx --runInBand`

Expected: FAIL because shell and non-overlap hit-target API do not exist.

- [ ] **Step 3: Implement `HouseGameShell`, `HouseChrome`, responsive hit targets**

Keep the 1000×1000 logical RoomCanvas coordinate system. Move actual actor button bounds to `getAnimalHitTargets`, animate actor body/name tag together, and provide a textual accessible actor list.

- [ ] **Step 4: Run focused tests and web build**

Run: `npm test -- src/game/room/__tests__/roomLayout.test.ts src/features/house-shell/components/__tests__/HouseGameShell.test.tsx --runInBand && EXPO_PUBLIC_APP_MODE=demo npm run build:web`

Expected: PASS; Expo exports web routes.

- [ ] **Step 5: Commit**

```bash
git add src/features/house-shell src/game/room src/features/room/components/AnimalActor.tsx src/features/room/components/RoomCanvas.web.tsx
git commit -m "feat(ui): add responsive house game shell"
```

### Task 3: Home stage, animal prompt, and detail Bottom Sheet

**Files:**
- Create: `src/features/house-shell/components/HouseOverlay.tsx`
- Create: `src/features/room/components/AnimalDetailSheet.tsx`, `src/features/room/components/HomePrompt.tsx`
- Create: `src/features/room/components/__tests__/AnimalDetailSheet.test.tsx`
- Modify: `src/features/room/screens/HomeScreen.tsx`, `src/features/room/screens/__tests__/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `HouseGameShell`, shell state, `Animal`, `Member`, `AnimalAction`, `useAnimalAction`.
- Produces: `AnimalDetailSheet({ animal, owner, disabled, onAction, onDismiss })`.
- Produces: `HomePrompt({ animal, onPress })` and `HouseOverlay({ visible, accessibilityLabel, onDismiss, children })`.

- [ ] **Step 1: Write failing sheet/home tests**

Assert animal press opens a dialog while the room remains rendered; each action calls the existing mutation with selected animal ID; offline/pending disables actions; close and scrim dismiss; HomePrompt opens the same sheet.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/room/components/__tests__/AnimalDetailSheet.test.tsx src/features/room/screens/__tests__/HomeScreen.test.tsx --runInBand`

Expected: FAIL because detail sheet and prompt do not exist.

- [ ] **Step 3: Implement overlay, prompt, sheet, and HomeScreen composition**

Replace header action stack, `MemberStrip`, and `AnimalActions` side panel with shell chrome, room stage, prompt, selected-animal sheet. Direct animal tap retains `reacting`; sheet actions issue existing server-confirmed mutations only.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npm test -- src/features/room/components/__tests__/AnimalDetailSheet.test.tsx src/features/room/screens/__tests__/HomeScreen.test.tsx --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/house-shell/components src/features/room/components src/features/room/screens
git commit -m "feat(ui): present animal actions in room sheet"
```

### Task 4: Persistent-room decorate tray and shop segment

**Files:**
- Create: `src/features/decorate/components/DecorateTray.tsx`, `src/features/decorate/components/__tests__/DecorateTray.test.tsx`
- Modify: `src/features/decorate/screens/DecorateScreen.tsx`, `src/features/decorate/screens/__tests__/DecorateScreen.test.tsx`
- Modify: `src/features/room/components/RoomCanvas.web.tsx`

**Interfaces:**
- Consumes: `HouseGameShell`, `RoomCanvas`, `useHomeSnapshot`, `usePlaceItem`, `useHouseShellStore`, `ITEM_BY_ID`.
- Produces: `DecorateTray({ snapshot, placement, selectedOwnedItemId, onSelect, onPlace, isOnline, isPending, onOpenShop })`.
- Produces: room furniture visual input from current `placements`/`ownedItems`, not a hard-coded accent only.

- [ ] **Step 1: Write failing decorate-tray tests**

Assert room stays mounted while tray opens; cards show item and owner; current-user furniture calls placement with version; other-member furniture is visible with no selection/place control; offline disables placement but preserves selection visual.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/decorate/components/__tests__/DecorateTray.test.tsx src/features/decorate/screens/__tests__/DecorateScreen.test.tsx --runInBand`

Expected: FAIL because the tray and full placement-derived room input do not exist.

- [ ] **Step 3: Implement `DecorateTray` and shell-based `DecorateScreen`**

Keep `expectedVersion` in `usePlaceItem`; render current placements through catalog metadata; show selected movable preview/highlight. In this plan, `shop` segment navigates to existing `/shop`; do not duplicate purchase logic.

- [ ] **Step 4: Run focused tests and regression**

Run: `npm test -- src/features/decorate src/features/shop --runInBand && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/decorate src/features/room/components/RoomCanvas.web.tsx
git commit -m "feat(ui): keep room visible while decorating"
```

### Task 5: Scrapbook memories and completion reward presentation

**Files:**
- Create: `src/features/memories/components/ScrapbookMemoryCard.tsx`, `src/features/memories/components/MemoryFurnitureCompletionModal.tsx`
- Create: `src/features/memories/components/__tests__/ScrapbookMemoryCard.test.tsx`
- Modify: `src/features/memories/screens/MemoriesScreen.tsx`, `src/features/memories/screens/__tests__/MemoriesScreen.test.tsx`, `src/features/memories/screens/MemoryComposerScreen.tsx`

**Interfaces:**
- Consumes: `MemorySummary`, current/archived hooks and existing creation/contribution results.
- Produces: `ScrapbookMemoryCard({ memory, onPress, scope: 'current' | 'archive' })`.
- Produces: `MemoryFurnitureCompletionModal({ memory, onKeepInInventory, onPlaceInRoom, onDismiss })`.

- [ ] **Step 1: Write failing memory presentation tests**

Assert current memories group by `occurredOn` month and render title/participants/date/open control; archived summaries appear only under `개인 보관함`; empty state retains CTA. Assert newly completed result opens one modal; third contribution/revision does not re-open for the same memory ID.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/memories/components/__tests__/ScrapbookMemoryCard.test.tsx src/features/memories/screens/__tests__/MemoriesScreen.test.tsx --runInBand`

Expected: FAIL because scrapbook cards and completion presentation state do not exist.

- [ ] **Step 3: Implement cards and completion modal wiring**

Queries remain authority for current/archive scope. Derive one completion key from contribution/share result. `방에 놓기` uses fresh placement/version snapshot; `보관함에 두기` dismisses without mutation.

- [ ] **Step 4: Run focused tests and memory regression**

Run: `npm test -- src/features/memories --runInBand && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/memories
git commit -m "feat(ui): present memories as scrapbook album"
```

### Task 6: Integration verification and documentation

**Files:**
- Modify: `docs/decisions.md`, `docs/progress.md`
- Modify: affected tests from Tasks 1–5

**Interfaces:**
- Consumes: complete shell/room/sheet/tray/album interfaces.
- Produces: documented actual verification boundary and release-ready Demo Mode web build.

- [ ] **Step 1: Write failing integration tests**

Assert Home→sheet→action→dismiss keeps room snapshot; Home→꾸미기→return preserves room placement; memory card opens detail route; reduced-motion does not request repeated animation.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/room src/features/decorate src/features/memories --runInBand`

Expected: FAIL until all shell interfaces are integrated.

- [ ] **Step 3: Complete integration and document actual checks**

Record game-shell ownership, desktop behavior, placeholder asset status, and only actually-run verification. Do not claim iOS/Android, multi-account Supabase, or final illustration verification.

- [ ] **Step 4: Run complete automated verification**

Run: `npm test -- --runInBand --forceExit && npm run typecheck && npm run lint && EXPO_PUBLIC_APP_MODE=demo npm run build:web && npm run verify:web:export`

Expected: Jest, typecheck, lint, export, and artifact verification exit 0.

- [ ] **Step 5: Run browser checks at 390px and 1280px**

Run: `npm run preview:web`; verify `/`, `/decorate`, `/memories`.

Expected: room is primary surface; targets do not overlap; sheet/tray/album controls work. Record as browser-only verification.

- [ ] **Step 6: Commit**

```bash
git add docs src
git commit -m "docs(ui): record house game shell verification"
```

## Deferred Follow-up Plan

After this visual foundation passes, write a separate plan for invite sheet, attendance reward modal, in-tray Shop UI (replacing interim route navigation), desktop rail polish, push-entry routing, and production/Supabase device verification. They require their own server-state and real-environment acceptance criteria and must not silently expand this plan.

## Self-Review

- Spec coverage: Tasks 1–5 cover the shared shell and the four first-scope screens; Task 6 covers responsive, accessibility, motion, and artifact checks. Invite/attendance are explicitly deferred by scope.
- Type consistency: `HouseOverlay`, `HouseGameShell`, `HouseChrome`, `AnimalDetailSheet`, `DecorateTray`, and `ScrapbookMemoryCard` are defined before later tasks consume them.
- Review focus: all five risks have named owning tasks and tests.
- Proportion: this plan contains contracts, TDD steps and commands, not implementation bodies.
