# Responsive UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일·태블릿·데스크톱에서 우리집의 방, 목록, 폼과 탐색이 같은 반응형 규칙으로 자연스럽게 동작하게 한다.

**Architecture:** `src/theme/responsive.ts`가 폭 기반 breakpoint와 page/grid 값을 순수 함수로 제공하고, `ResponsivePage`가 정보성 화면의 safe area·gutter·scroll 여백을 소유한다. `HouseGameShell`은 이 contract를 소비해 compact/medium 하단 탭과 wide 좌측 레일·보조 패널을 전환한다. repository, RPC, RLS, 게임 상태는 전혀 변경하지 않는다.

**Tech Stack:** Expo Router, React Native + React Native Web, TypeScript, React Native Testing Library, Jest.

**Spec:** `docs/superpowers/specs/2026-09-30-responsive-ui-ux-design.md`

## Global Constraints

- breakpoint는 compact `0~599`, medium `600~899`, wide `900px+`로 고정한다.
- 집 정원 4명, 사용자당 활성 집 하나, 개인 소유권과 모든 서버 확정 mutation을 바꾸지 않는다.
- Demo Mode와 Supabase Mode는 기존 repository/component contract를 유지한다.
- compact/medium의 모든 기본 조작 target은 44×44pt 이상이어야 한다.
- offline read-only, empty/error, 사진 업로드 실패의 현재 의미와 copy를 바꾸지 않는다.
- wide 웹에서 모바일 뒤로가기와 하단 탭을 중복 노출하지 않는다.
- 최종 에셋이 아닌 항목의 `placeholder` 상태를 바꾸지 않는다.

## Review Focus

- 599/600/899/900px 경계: `getResponsiveLayout` test가 정확한 breakpoint·grid·gutter를 고정한다.
- 글자 확대: `fontScale: 1.3`에서도 card title과 CTA가 잘리지 않는 것을 Task 2/4 component test로 고정한다.
- 하단 탭: compact/medium scroll content 끝이 66px tab과 safe area에 가려지지 않는 것을 Task 2 test로 고정한다.
- 4인 방: 390px, 768px, 1280px에서 동물 터치 영역이 겹치지 않는 기존 room layout regression을 Task 3에서 실행한다.
- 직접 링크: wide에서 뒤로가기 버튼이 숨고 compact/medium에서 fallback navigation이 유지되는 것을 Task 2 test로 고정한다.

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/theme/responsive.ts` | breakpoint, gutter, grid column, bottom safe space의 순수 계산 |
| `src/theme/__tests__/responsive.test.ts` | 경계 폭과 layout contract 회귀 |
| `src/components/layout/ResponsivePage.tsx` | 정보성 화면의 SafeArea, scroll, 최대 폭, padding |
| `src/components/layout/__tests__/ResponsivePage.test.tsx` | mobile/desktop back nav, scroll safe space, font scale 회귀 |
| `src/features/house-shell/components/HouseGameShell.tsx` | room shell의 compact/medium/wide navigation과 side panel |
| `src/features/decorate/components/DecorateTray.tsx` | wide 보조 패널과 compact/medium bottom tray |
| `src/features/{shop,inventory,memories,settings,habits,dev,house}` | 공통 responsive page/grid 적용 |
| `docs/progress.md`, `docs/decisions.md` | 실제 검증과 선택한 tablet/wide 기본값 기록 |

### Task 1: Responsive layout contract

**Files:**
- Create: `src/theme/responsive.ts`
- Create: `src/theme/__tests__/responsive.test.ts`
- Modify: `src/theme/tokens.ts`

**Interfaces:**
- Produces `Breakpoint = 'compact' | 'medium' | 'wide'`.
- Produces `getResponsiveLayout(width: number): { breakpoint: Breakpoint; pageGutter: number; gridColumns: 1 | 2 | 3 | 4; bottomSafeSpace: number }`.
- Consumed by all remaining tasks; no repository or navigation interface changes.

- [ ] **Step 1: Write failing responsive contract tests**

```ts
expect(getResponsiveLayout(599)).toMatchObject({ breakpoint: 'compact', pageGutter: 16, gridColumns: 1 });
expect(getResponsiveLayout(600)).toMatchObject({ breakpoint: 'medium', pageGutter: 24, gridColumns: 2 });
expect(getResponsiveLayout(900)).toMatchObject({ breakpoint: 'wide', pageGutter: 32, gridColumns: 3 });
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/theme/__tests__/responsive.test.ts --runInBand --no-watchman`

Expected: FAIL because `getResponsiveLayout` does not exist.

- [ ] **Step 3: Implement `getResponsiveLayout(width: number)`**

Use only the three numeric width ranges in the spec. Keep this module platform independent so Jest and React Native Web use the same contract.

- [ ] **Step 4: Run focused verification**

Run: `npm test -- src/theme/__tests__/responsive.test.ts --runInBand --no-watchman && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme
git commit -m "feat(ui): add responsive layout contract"
```

### Task 2: Shared responsive page and navigation frame

**Files:**
- Create: `src/components/layout/ResponsivePage.tsx`
- Create: `src/components/layout/__tests__/ResponsivePage.test.tsx`
- Modify: `src/features/illustrated-ui/chrome/MobileBackButton.tsx`
- Modify: `src/features/illustrated-ui/chrome/__tests__/MobileBackButton.test.tsx`

**Interfaces:**
- Consumes `getResponsiveLayout` from Task 1 and existing `MobileBackButton({ fallbackHref })` API.
- Produces `ResponsivePage({ children, contentMaxWidth, scroll, fallbackHref, testID? })`.
- Produces a `useResponsiveLayout()` hook based on `useWindowDimensions` for component consumers.

- [ ] **Step 1: Write failing page-frame tests**

```tsx
render(<ResponsivePage fallbackHref="/">content</ResponsivePage>);
expect(view.getByLabelText('이전 화면으로 돌아가기')).toBeOnTheScreen();
// With width 1280, assert the back control is absent and content max width is retained.
```

Also assert compact scroll content has `bottomSafeSpace` beyond the 66px navigation bar and fontScale 1.3 keeps a 44px action target.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/layout/__tests__/ResponsivePage.test.tsx src/features/illustrated-ui/chrome/__tests__/MobileBackButton.test.tsx --runInBand --no-watchman`

Expected: FAIL because `ResponsivePage` does not exist and `MobileBackButton` only distinguishes web wide/non-wide.

- [ ] **Step 3: Implement page frame and back control breakpoint behavior**

`ResponsivePage` owns SafeArea, horizontal gutter, max width and optional ScrollView padding. `MobileBackButton` renders in compact and medium, never wide, while preserving history-first/fallback-second navigation.

- [ ] **Step 4: Run focused verification**

Run: `npm test -- src/components/layout src/features/illustrated-ui/chrome --runInBand --no-watchman && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/features/illustrated-ui/chrome
git commit -m "feat(ui): add responsive page frame"
```

### Task 3: Room shell and decorate tray responsiveness

**Files:**
- Modify: `src/features/house-shell/components/HouseGameShell.tsx`
- Modify: `src/features/house-shell/components/__tests__/HouseGameShell.test.tsx`
- Modify: `src/features/decorate/components/DecorateTray.tsx`
- Modify: `src/features/decorate/components/__tests__/DecorateTray.test.tsx`
- Modify: `src/features/illustrated-ui/scene/RoomScene.tsx`
- Modify: `src/features/illustrated-ui/scene/__tests__/RoomScene.test.tsx`
- Modify: `src/game/room/__tests__/roomLayout.test.ts`

**Interfaces:**
- Consumes Task 1 `useResponsiveLayout` and existing `HouseGameShell`, `DecorateTray`, room/placement interfaces.
- Produces unchanged domain props; only layout orientation and available scene bounds change.

- [ ] **Step 1: Write failing shell/tray breakpoint tests**

```tsx
// 768px: bottom tab remains and the room plus tray are visible.
// 900px: desktop rail appears and tray exposes an aside layout.
// 390/768/1280px: getAnimalHitTargets(4, viewport) remain non-overlapping.
```

Assert the wide tray does not duplicate a mobile bottom sheet and that offline/other-owner placement controls retain current disabled/read-only behavior.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/house-shell src/features/decorate src/features/illustrated-ui/scene src/game/room --runInBand --no-watchman`

Expected: FAIL because medium/wide layouts are not modeled by the shared contract.

- [ ] **Step 3: Implement responsive room and decorate composition**

Use bottom tab/tray for compact and medium; use left rail plus a right-hand decorate aside at wide. Clamp the scene by available height, retaining its 1000×1000 coordinate mapping and all existing hit targets.

- [ ] **Step 4: Run focused verification and demo export**

Run: `npm test -- src/features/house-shell src/features/decorate src/features/illustrated-ui/scene src/game/room --runInBand --no-watchman && EXPO_PUBLIC_APP_MODE=demo npm run build:web`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/house-shell src/features/decorate src/features/illustrated-ui src/game/room
git commit -m "feat(ui): make room shell responsive"
```

### Task 4: Catalog, memories, and detail page grids

**Files:**
- Modify: `src/features/shop/screens/ShopScreen.tsx`, `src/features/shop/screens/__tests__/ShopScreen.test.tsx`
- Modify: `src/features/inventory/screens/InventoryScreen.tsx`
- Modify: `src/features/memories/screens/MemoriesScreen.tsx`, `MemoryDetailScreen.tsx`, `MemoryComposerScreen.tsx`
- Modify: `src/features/memories/screens/__tests__/MemoriesScreen.test.tsx`, `MemoryComposerScreen.test.tsx`
- Modify: `src/features/dev/AssetGalleryScreen.tsx`, `src/features/dev/__tests__/AssetGalleryScreen.test.tsx`

**Interfaces:**
- Consumes Task 2 `ResponsivePage` and Task 1 layout values.
- Preserves shop purchase recovery, inventory ownership, memory viewer/archive and upload retry APIs.

- [ ] **Step 1: Write failing catalog/memory viewport tests**

```tsx
// 390px: shop and scrapbook render one content column.
// 768px: cards render two columns with card width >= 156.
// 1280px: shop uses 3 or 4 columns while memory detail stays max 760px.
```

Also assert the archived-memory section is preserved, photo failure copy remains, and compact content ends above the bottom tab safe space.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/shop src/features/inventory src/features/memories src/features/dev --runInBand --no-watchman`

Expected: FAIL because those screens still own fixed local widths/grids.

- [ ] **Step 3: Apply the shared responsive page/grid**

Use flex-basis/minWidth rather than percentage-only cards. Keep detail and composer in a single reading column; change only list/card density by breakpoint.

- [ ] **Step 4: Run focused verification**

Run: `npm test -- src/features/shop src/features/inventory src/features/memories src/features/dev --runInBand --no-watchman && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/shop src/features/inventory src/features/memories src/features/dev
git commit -m "feat(ui): adapt catalog and memories layouts"
```

### Task 5: Forms, entry flows, accessibility audit, and documentation

**Files:**
- Modify: `src/features/settings/SettingsScreen.tsx`, `src/features/settings/__tests__/SettingsScreen.test.tsx`
- Modify: `src/features/habits/HabitLearningScreen.tsx`
- Modify: `src/features/house/screens/HouseEntryChoiceScreen.tsx`, `HouseCreateScreen.tsx`, `InviteManagerScreen.tsx` and their tests
- Modify: `app/auth/sign-in.tsx`, `app/auth/sign-up.tsx`, `app/onboarding.tsx`, `app/invite/[token].tsx`
- Modify: `docs/progress.md`, `docs/decisions.md`

**Interfaces:**
- Consumes Task 2 page frame; existing form submit, auth, invite preview/acceptance and deletion callbacks remain unchanged.
- Produces responsive central-form layouts and final verification record.

- [ ] **Step 1: Write failing entry/form accessibility tests**

```tsx
// At 390px and fontScale 1.3, form CTA is accessible and not hidden by bottom safe space.
// At 768px and 1280px, form column remains between 520 and 720px.
// Invite expiry/full/error screen retains a labelled back action and its existing recovery CTA.
```

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- src/features/settings src/features/house src/features/habits src/auth --runInBand --no-watchman`

Expected: FAIL because form pages have individual padding/width contracts.

- [ ] **Step 3: Apply responsive frame and safe keyboard/scroll behavior**

Use `ResponsivePage` without changing submit callbacks. Keep 44pt actions, keyboard avoidance and all current empty/error/offline messages. Do not add server calls or mutate data on layout events.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test -- --runInBand --no-watchman --forceExit
npm run typecheck
npm run lint
EXPO_PUBLIC_APP_MODE=demo npm run build:web
npm run verify:web:export
```

Expected: all tests pass, typecheck/lint/export exit 0. Record any Jest async-handle warning and distinguish browser from real-device verification.

- [ ] **Step 5: Perform viewport checks and update docs**

Check 390×844, 768×1024 and 1280×720 in a browser when accessible. Record only observed results in `docs/progress.md`; keep iOS/Android as unverified unless a Development Build was actually used. Record the breakpoint choice in `docs/decisions.md`.

- [ ] **Step 6: Commit**

```bash
git add app src/features/settings src/features/house src/features/habits docs
git commit -m "feat(ui): complete responsive app layouts"
```

## Plan Self-Review

- Spec coverage: Task 1 covers the three responsive ranges; Task 2 covers page/safe-area/back behavior; Task 3 covers room and decorate; Task 4 covers catalog and memories; Task 5 covers forms, accessibility, offline/error preservation and documentation.
- Type consistency: all consumers use `Breakpoint`, `getResponsiveLayout`, `useResponsiveLayout`, and `ResponsivePage` defined by Tasks 1–2; no server or repository interface is introduced.
- Review focus: each of the five boundary cases has a test in its owning task.
- Scope: assets, server rules, free placement behavior and notification/device setup remain excluded.
