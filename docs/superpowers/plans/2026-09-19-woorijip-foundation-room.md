# 우리집 Foundation and Demo Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 저장소를 Expo SDK 57 기반 앱으로 초기화하고, 외부 계정 없이 네 명의 동물·구성원·가구를 확인하고 상호작용할 수 있는 실행 가능한 데모 방을 제공한다.

**Architecture:** Expo Router 앱 루트가 명시적 실행 모드를 읽어 repository 구현을 주입한다. 첫 단계는 메모리 기반 `DemoRepository`와 Skia 기준 좌표 방을 연결하며, UI 상태는 Zustand, 서버형 조회 상태는 TanStack Query에 둔다. 방 배치·동물 행동 규칙은 순수 TypeScript로 두고 Skia·Reanimated는 그 결과만 표현한다.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Expo Router, React Native Skia, Reanimated, Gesture Handler, Zustand, TanStack Query, Jest, React Native Testing Library, ESLint, EAS

**Spec:** `docs/superpowers/specs/2026-09-19-woorijip-design.md`

## Global Constraints

- 앱 이름은 `우리집`, URL scheme은 `woorijip`, 저장소 패키지 이름은 `our-cozy-home`이다.
- Node.js는 Expo SDK 57의 `>=18.13.0` 조건을 만족해야 하며 의존성은 `npx expo install`이 선택한 호환 버전을 잠금 파일에 저장한다.
- 실행 모드는 `EXPO_PUBLIC_APP_MODE=demo|supabase`만 허용하고 실제 연결 실패를 데모로 자동 전환하지 않는다.
- 방의 논리 좌표는 `1000 x 1000`, 터치 대상은 최소 44pt 상당, 동물은 최대 네 마리다.
- 배경은 크림색, 사용자 포인트는 부드러운 파스텔, 동물은 둥근 실루엣과 작은 눈을 사용한다.
- 데모 초기화는 데모 repository에만 있고 실제 모드 UI에는 노출하지 않는다.
- 이 계획의 그래픽은 `asset_status = placeholder`이며 최종 에셋 완료로 기록하지 않는다.
- 화면 컴포넌트는 출석·구매·완성·학습 보상을 확정하지 않는다.
- 각 production 변경은 먼저 실패하는 테스트를 확인한 뒤 최소 구현한다.

## Review Focus

- 실행 모드 값 또는 Supabase 환경 변수가 잘못되면 데모로 넘어가지 않고 설정 오류를 보여준다. Task 2의 `appMode.test.ts`와 `mode-error.test.tsx`가 검증한다.
- 320pt 폭의 작은 화면에서도 네 동물 이름표와 44pt 터치 영역이 겹치지 않는다. Task 5의 `roomLayout.test.ts`가 검증한다.
- 앱이 background로 이동하면 행동 타이머가 멈추고 active 복귀 시 repository 새로고침이 한 번만 실행된다. Task 6의 `useAppLifecycle.test.tsx`가 검증한다.
- 55개 카탈로그 항목에 방 렌더 메타데이터가 빠지면 에셋 목록 검증이 실패한다. Task 7의 `catalog.test.ts`가 검증한다.
- 데모 초기화는 데모 모드에서만 보이며 Supabase 모드 구성에는 해당 기능이 없다. Task 4와 Task 8의 repository·설정 화면 테스트가 검증한다.

---

### Task 1: Expo SDK 57 프로젝트 셸

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `app.json`
- Create: `eas.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`

**Interfaces:**
- Consumes: Node.js `>=18.13.0` and npm.
- Produces: `npm run start`, `npm run web`, `npm run typecheck`, `npm run lint`, `npm test`; Expo Router entry point and EAS development/preview/production profiles.

- [ ] **Step 1: Scaffold the generated Expo TypeScript app**

Run `npx create-expo-app@latest /tmp/our-cozy-home-scaffold --template default@sdk-57`, then copy the generated package/config foundation into the repository without overwriting `docs` or `.git`. Set package name to `our-cozy-home`, app name to `우리집`, slug to `our-cozy-home`, scheme to `woorijip`, iOS bundle identifier to `com.nno3onn.ourcozyhome`, and Android package to `com.nno3onn.ourcozyhome`.

- [ ] **Step 2: Install only Expo-compatible dependencies**

Run:

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar expo-dev-client \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated @shopify/react-native-skia
npm install @tanstack/react-query zustand @supabase/supabase-js
npm install --save-dev jest jest-expo @testing-library/react-native \
  @testing-library/jest-native @types/jest eslint-config-expo
```

Keep the versions written by npm and Expo in `package-lock.json`; do not replace them with unrelated latest versions.

- [ ] **Step 3: Add quality scripts and a smoke test target**

`package.json` scripts must include:

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "typecheck": "tsc --noEmit",
  "lint": "expo lint",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

- [ ] **Step 4: Verify the generated shell**

Run `npm run typecheck`, `npm run lint`, and `npx expo export --platform web`. Expected: all exit 0 and a web bundle is written without treating it as iOS·Android verification.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json eas.json tsconfig.json eslint.config.js jest.config.js jest.setup.ts .gitignore .env.example app
git commit -m "chore: initialize Expo application"
```

### Task 2: Explicit Runtime Mode and Application Providers

**Files:**
- Create: `src/config/appMode.ts`
- Create: `src/config/env.ts`
- Create: `src/config/__tests__/appMode.test.ts`
- Create: `src/app/AppProviders.tsx`
- Create: `src/components/ModeErrorScreen.tsx`
- Create: `src/components/DemoBanner.tsx`
- Create: `src/components/__tests__/mode-error.test.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/index.tsx`

**Interfaces:**
- Produces: `parseAppMode(value: string | undefined): AppModeResult`, `AppMode = 'demo' | 'supabase'`, `AppProviders`, and `DemoBanner`.
- Supabase mode additionally requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 1: Write failing mode parsing tests**

```ts
expect(parseAppMode('demo')).toEqual({ ok: true, mode: 'demo' });
expect(parseAppMode(undefined)).toEqual({ ok: false, reason: 'missing_app_mode' });
expect(parseAppMode('production')).toEqual({ ok: false, reason: 'invalid_app_mode' });
expect(resolveRuntimeConfig({ mode: 'supabase' })).toEqual({
  ok: false,
  reason: 'missing_supabase_environment',
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/config/__tests__/appMode.test.ts --runInBand`. Expected: FAIL because `parseAppMode` does not exist.

- [ ] **Step 3: Implement strict mode parsing and providers**

Use a discriminated union so invalid configuration cannot expose repositories. `AppProviders` owns QueryClient, GestureHandler root and SafeArea provider. `ModeErrorScreen` explains how to set demo mode; it must not mutate the mode itself.

- [ ] **Step 4: Test the visible error and demo banner**

Render the missing-mode route and assert an accessible `설정 확인` heading and `EXPO_PUBLIC_APP_MODE=demo` guidance. Render demo mode and assert a visible `데모 모드` status label.

- [ ] **Step 5: Verify and commit**

Run `npm test -- src/config src/components/__tests__/mode-error.test.tsx --runInBand`, `npm run typecheck`, and `npm run lint`.

```bash
git add app src/config src/app src/components
git commit -m "feat: require an explicit application mode"
```

### Task 3: Design Tokens and Accessible Primitives

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `src/components/ui/AppText.tsx`
- Create: `src/components/ui/AppButton.tsx`
- Create: `src/components/ui/Panel.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/__tests__/AppButton.test.tsx`
- Create: `src/components/ui/__tests__/EmptyState.test.tsx`

**Interfaces:**
- Produces: `colors`, `spacing`, `radii`, `typeScale`, `motion`; `AppButton` with required `accessibilityLabel` for icon-only mode; `EmptyState` with optional action.

- [ ] **Step 1: Write failing accessibility tests**

Test that a text button exposes the button role and disabled state, an icon-only button throws in development without `accessibilityLabel`, and `EmptyState` exposes its heading and action.

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/components/ui --runInBand`. Expected: FAIL because the primitives do not exist.

- [ ] **Step 3: Implement the compact token system**

Use named colors `cream`, `paper`, `ink`, `mutedInk`, `peach`, `mint`, `sky`, `lilac`, `line`, and `danger`. Use one sans-serif system family, sentence case copy, visible focus/pressed states and minimum 44pt control height. Do not add gradients or generic shadow cards.

- [ ] **Step 4: Verify and commit**

Run `npm test -- src/components/ui --runInBand`, `npm run typecheck`, and `npm run lint`.

```bash
git add src/theme src/components/ui
git commit -m "feat: add accessible design primitives"
```

### Task 4: Domain Types, Repository Contract, and Demo State

**Files:**
- Create: `src/domain/models.ts`
- Create: `src/domain/repository.ts`
- Create: `src/repositories/demo/demoSeed.ts`
- Create: `src/repositories/demo/DemoRepository.ts`
- Create: `src/repositories/demo/__tests__/DemoRepository.test.ts`
- Create: `src/repositories/createRepository.ts`
- Create: `src/repositories/__tests__/createRepository.test.ts`
- Create: `src/types/database.generated.ts`

**Interfaces:**
- Produces: `HomeRepository` with `getHomeSnapshot()`, `performAnimalAction(animalId, action)`, `placeItem(input)`, `listMemories()`, `listHabitLearning()`, and optional `resetDemo()` only on `DemoRepository`.
- Produces: `HomeSnapshot`, `Member`, `Animal`, `OwnedItem`, `RoomPlacement`, `MemorySummary`, `HabitLearningSummary`, `AnimalAction`.

- [ ] **Step 1: Write failing repository behavior tests**

Use a fresh repository per test. Assert four seeded members have unique IDs and point colors, two animal species can repeat, actions update only the selected animal, a valid fixed-slot placement increments its version, and reset restores the original snapshot.

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/repositories --runInBand`. Expected: FAIL because the repository contract and demo implementation do not exist.

- [ ] **Step 3: Implement immutable demo state**

Return cloned snapshots so screens cannot mutate source state. Keep all rule transitions in repository methods, not components. `createRepository('supabase')` must return a typed `not_configured` implementation error until the Supabase repository is implemented; it must never return demo data.

- [ ] **Step 4: Add a generated-type boundary**

Create a checked-in empty `Database` shape documenting that it is replaced only by `supabase gen types typescript`; no screen imports it directly.

- [ ] **Step 5: Verify and commit**

Run `npm test -- src/repositories --runInBand`, `npm run typecheck`, and `npm run lint`.

```bash
git add src/domain src/repositories src/types
git commit -m "feat: add demo repository contract"
```

### Task 5: Room Coordinate and Layering Engine

**Files:**
- Create: `src/game/room/constants.ts`
- Create: `src/game/room/roomLayout.ts`
- Create: `src/game/room/layers.ts`
- Create: `src/game/room/__tests__/roomLayout.test.ts`
- Create: `src/game/room/__tests__/layers.test.ts`

**Interfaces:**
- Produces: `ROOM_SIZE = { width: 1000, height: 1000 }`, `getAnimalAnchors(memberCount)`, `toViewport(point, viewport)`, `getHitTarget(anchor, viewport)`, and `sortRoomActors(actors)`.

- [ ] **Step 1: Write failing layout tests**

For member counts 1 through 4, assert the correct anchor count and in-bounds logical coordinates. For a `320 x 568` viewport and four members, assert every hit target is at least 44pt and no pair intersects. Assert layer ordering uses foot-point y and stable ID as the tie-breaker.

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/game/room --runInBand`. Expected: FAIL because layout functions do not exist.

- [ ] **Step 3: Implement deterministic layout**

Use explicit anchor presets for 1, 2, 3 and 4 animals rather than dynamic physics. Preserve aspect ratio and center letterboxed content in the safe viewport. Keep labels in dedicated bands so names do not overlap animals or each other.

- [ ] **Step 4: Verify and commit**

Run `npm test -- src/game/room --runInBand`, `npm run typecheck`, and `npm run lint`.

```bash
git add src/game/room
git commit -m "feat: add deterministic room layout"
```

### Task 6: Interactive Skia Demo Room and Lifecycle

**Files:**
- Create: `src/features/room/hooks/useHomeSnapshot.ts`
- Create: `src/features/room/hooks/useAppLifecycle.ts`
- Create: `src/features/room/hooks/__tests__/useAppLifecycle.test.tsx`
- Create: `src/features/room/components/RoomCanvas.tsx`
- Create: `src/features/room/components/AnimalActor.tsx`
- Create: `src/features/room/components/MemberStrip.tsx`
- Create: `src/features/room/components/AnimalActions.tsx`
- Create: `src/features/room/screens/HomeScreen.tsx`
- Create: `src/features/room/screens/__tests__/HomeScreen.test.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/decorate.tsx`
- Create: `app/(tabs)/memories.tsx`

**Interfaces:**
- Consumes: `HomeRepository`, room layout functions and UI primitives.
- Produces: runnable `우리집` tab, selected-animal action buttons and lifecycle refresh callback.

- [ ] **Step 1: Write failing user-flow tests**

Render `HomeScreen` with the demo repository. Assert `4/4`, four member names, four accessible animal buttons, and general `먹기`, `쉬기`, `놀기` action buttons. Press an animal then `놀기` and assert its displayed state becomes `놀고 있어요` without presenting an online indicator.

- [ ] **Step 2: Write the lifecycle failure test**

Emit `background` then advance fake timers and assert local behavior ticks stop. Emit `active` twice and assert `getHomeSnapshot` is refreshed once per actual state transition. Unmount and assert the AppState listener is removed.

- [ ] **Step 3: Run tests and confirm RED**

Run `npm test -- src/features/room --runInBand`. Expected: FAIL because room components and lifecycle hook do not exist.

- [ ] **Step 4: Implement the room screen**

Draw a cream room shell, floor/wall division, placeholder rug/table/plant and round animal silhouettes in Skia. Render names and accessible hit targets with React Native overlays so screen readers and tests do not depend on canvas text. Use reduced-motion preference to disable repeated breathing/bounce loops. The direct character touch and ordinary action button must invoke the same repository command.

- [ ] **Step 5: Implement tabs without fake completion**

The decorate and memories tabs show truthful empty states connected to the next planned features, not controls that claim server-backed success.

- [ ] **Step 6: Verify and commit**

Run `npm test -- src/features/room --runInBand`, `npm run typecheck`, `npm run lint`, and `npx expo export --platform web`.

```bash
git add app src/features/room
git commit -m "feat: render the interactive demo room"
```

### Task 7: Complete Placeholder Item Catalog and Asset Gallery

**Files:**
- Create: `src/catalog/items.ts`
- Create: `src/catalog/catalogValidation.ts`
- Create: `src/catalog/__tests__/catalog.test.ts`
- Create: `src/features/dev/AssetGalleryScreen.tsx`
- Create: `src/features/dev/__tests__/AssetGalleryScreen.test.tsx`
- Create: `app/dev/assets.tsx`
- Modify: `src/repositories/demo/demoSeed.ts`

**Interfaces:**
- Produces: `ITEM_CATALOG` containing exactly 40 shop items and 15 memory furniture variants; `validateCatalog(items)`; development route `/dev/assets` in demo/development mode only.

- [ ] **Step 1: Write failing catalog tests**

Assert eight shop categories each contain five items and three memory categories each contain five appearances. For every item assert unique ID, Korean name, positive integer price for shop goods, thumbnail key, room asset key, logical size, anchor, allowed slot list, layer bias, interaction kind and `assetStatus`.

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/catalog --runInBand`. Expected: FAIL because the catalog does not exist.

- [ ] **Step 3: Implement catalog definitions**

Provide distinct Korean names and change silhouette/decor metadata, not only color, across five products. Use code-drawn placeholder renderer keys and mark all initial entries `placeholder`.

- [ ] **Step 4: Implement the development gallery**

Show category counts, thumbnail preview, room-scale preview and all placement metadata. Display `임시 에셋` on every placeholder and never label it final. Exclude the route from production mode navigation.

- [ ] **Step 5: Verify and commit**

Run `npm test -- src/catalog src/features/dev --runInBand`, `npm run typecheck`, and `npm run lint`.

```bash
git add app/dev src/catalog src/features/dev src/repositories/demo/demoSeed.ts
git commit -m "feat: add complete placeholder item catalog"
```

### Task 8: Demo Reset, README, and Phase Verification

**Files:**
- Create: `src/features/settings/SettingsScreen.tsx`
- Create: `src/features/settings/__tests__/SettingsScreen.test.tsx`
- Create: `app/settings.tsx`
- Create: `README.md`
- Modify: `docs/progress.md`
- Modify: `docs/decisions.md`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: runtime mode and repository capabilities.
- Produces: demo-only reset flow, accurate install/run documentation and verification ledger.

- [ ] **Step 1: Write failing reset visibility tests**

Render settings with demo capabilities and assert `데모 데이터 초기화` is present and confirms before resetting. Render a Supabase-mode repository capability object and assert the reset action is absent; no hidden press target may remain.

- [ ] **Step 2: Run tests and confirm RED**

Run `npm test -- src/features/settings --runInBand`. Expected: FAIL because settings does not exist.

- [ ] **Step 3: Implement reset and documentation**

README must document Node, npm install, `.env`, demo start, web preview, Development Build commands, Supabase variables, honest phase status, and links to product/architecture/progress/decisions. State that Supabase, Auth, Realtime, Storage, push and actual devices are not connected in this phase.

- [ ] **Step 4: Run the full phase verification**

Run:

```bash
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo export --platform web
```

Expected: all commands exit 0. Open the exported web app or local Expo web preview and record only a web visual check. Do not record iOS·Android verification.

- [ ] **Step 5: Update progress with exact evidence**

Record command, result, date, implemented demo features, placeholder asset status, unimplemented Supabase features and the next vertical slice: authentication plus house create/invite/join/leave.

- [ ] **Step 6: Commit**

```bash
git add README.md app/settings.tsx app/'(tabs)'/_layout.tsx src/features/settings docs/progress.md docs/decisions.md
git commit -m "docs: document the runnable demo foundation"
```
