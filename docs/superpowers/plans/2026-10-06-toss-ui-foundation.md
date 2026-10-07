# Toss-style UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 우리집의 모든 후속 화면이 같은 토큰과 상호작용 계약을 사용하도록 토스식 공통 UI Foundation을 구현한다.

**Architecture:** 기존 `src/theme`을 semantic token의 단일 기준으로 바꾸고, `src/components/ui`에 화면 독립적인 primitive를 둔다. 화면은 이 단계에서 전면 재작성하지 않되 기존 API에 필요한 호환성을 유지하여 Demo Mode와 현재 route를 깨뜨리지 않는다. Snackbar처럼 전역 상태가 필요한 기능만 `AppProviders`에 provider를 추가한다.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, Jest, React Native Testing Library

**Spec:** `docs/superpowers/specs/2026-10-06-toss-style-ui-system-design.md`

## Global Constraints

- 제품 규칙, Supabase RPC·RLS, repository 계약, route slug와 Demo Mode 동작을 변경하지 않는다.
- UI 기본 색은 `#F7F8FA`, 표면은 `#FFFFFF`, 본문은 `#191F28`, primary action은 `#3182F6`을 사용한다.
- 기본 본문 크기는 16/24이며 icon-only button은 최소 44×44와 한국어 접근성 이름을 가진다.
- 색만으로 선택·성공·오류를 구분하지 않는다.
- reduced motion에서는 shimmer와 반복 scale animation을 사용하지 않는다.
- 기존 화면이 새 Foundation으로 순차 전환되는 동안 legacy token key를 compatibility alias로 유지한다.
- 이 Issue는 하나의 구현 commit으로 끝내고 개별 화면 전체 개편은 후속 Issue로 분리한다.

## Review Focus

- 기존 화면이 legacy `colors.cream`, `colors.ink`, `variant="heading"`, `tone="quiet"`를 사용해도 컴파일되고 의미가 크게 바뀌지 않아야 한다.
- 320px 화면에서 페이지 header의 back control과 긴 제목이 겹치지 않아야 한다.
- label 없는 icon-only button은 계속 거부되어야 하고 disabled·selected 상태가 접근성 트리에 노출되어야 한다.
- Snackbar가 연속 호출될 때 마지막 메시지가 사라지거나 동시에 중첩되지 않아야 한다.
- reduced motion이나 테스트 환경에서 Skeleton이 영구 timer 또는 열린 handle을 남기지 않아야 한다.

---

### Task 1: Semantic theme and responsive contract

**Files:**
- Modify: `src/theme/tokens.ts`
- Modify: `src/theme/responsive.ts`
- Modify: `src/theme/__tests__/responsive.test.ts`
- Create: `src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: 기존 `colors`, `spacing`, `radii`, `typeScale`, `motion`, `responsiveBreakpoints` import 계약
- Produces: semantic `colors`, `spacing`, `radii`, `elevation`, `typeScale`, `motion`, `zIndex`; `getResponsiveLayout(width)`의 20/28/32 gutter 계약

- [ ] **Step 1: semantic token과 compatibility alias를 검증하는 실패 테스트 작성**

  `tokens.test.ts`에서 `background === '#F7F8FA'`, `textPrimary === '#191F28'`, `brand === '#3182F6'`, `typeScale.body`가 16/24, `radii.control === 14`, legacy `cream === background`와 `ink === textPrimary`를 단언한다.

- [ ] **Step 2: responsive gutter 실패 테스트 추가 후 RED 확인**

  Run: `npm test -- src/theme/__tests__/tokens.test.ts src/theme/__tests__/responsive.test.ts --runInBand`

  Expected: 새 token이 없거나 compact/medium gutter가 기존 16/24라서 FAIL.

- [ ] **Step 3: semantic token과 responsive layout 구현**

  `tokens.ts`에 명세 값과 compatibility alias를 추가하고 `responsive.ts`를 compact 20, medium 28, wide 32로 바꾼다. `gridColumns`는 기존 화면 회귀를 피하기 위해 이 단계에서 유지한다.

- [ ] **Step 4: GREEN 확인**

  Run: `npm test -- src/theme/__tests__/tokens.test.ts src/theme/__tests__/responsive.test.ts --runInBand`

  Expected: PASS.

### Task 2: Typography and button primitives

**Files:**
- Create: `assets/fonts/PretendardVariable.ttf`
- Create: `assets/fonts/OFL.txt`
- Create: `src/theme/fonts.ts`
- Create: `src/theme/__tests__/fonts.test.ts`
- Modify: `src/components/ui/AppText.tsx`
- Modify: `src/components/ui/AppButton.tsx`
- Modify: `src/components/ui/__tests__/AppButton.test.tsx`
- Create: `src/components/ui/__tests__/AppText.test.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: Task 1의 `typeScale`, semantic `colors`, `radii`, `spacing`
- Produces: `appFonts`와 `fontFamilies`; `AppText` variants `display | title | sectionTitle | headline | body | bodyStrong | label | caption`; tones `default | secondary | tertiary | brand | success | warning | danger | inverse`; `AppButton` tones `primary | secondary | tertiary | danger | icon`과 legacy `quiet` alias

- [ ] **Step 1: 로컬 글꼴 map 실패 테스트 작성**

  `fonts.test.ts`에서 `appFonts.Pretendard`가 저장소의 `PretendardVariable.ttf`를 참조하고 `fontFamilies.sans === 'Pretendard'`인지 검증한다. 글꼴 파일과 OFL license는 Pretendard 공식 배포본의 동일 release에서 가져온다.

- [ ] **Step 2: AppText semantic variant·tone 실패 테스트 작성**

  `display`가 32/40/700과 Pretendard family, `secondary`가 `textSecondary`, legacy `heading`이 `sectionTitle`과 같은 typography를 쓰는지 렌더 style로 검증한다.

- [ ] **Step 3: AppButton 상태·tone 실패 테스트 작성 후 RED 확인**

  primary 높이 52와 brand 배경, icon-only 44×44, secondary와 danger 색, disabled·selected accessibility state를 검증한다.

  Run: `npm test -- src/theme/__tests__/fonts.test.ts src/components/ui/__tests__/AppText.test.tsx src/components/ui/__tests__/AppButton.test.tsx --runInBand`

  Expected: 새 variant/tone과 크기가 없어 FAIL.

- [ ] **Step 4: 글꼴 로딩과 AppText·AppButton 구현**

  root layout은 `useFonts(appFonts)`가 끝나기 전 기존 route를 렌더하지 않고 splash를 유지한다. pressed feedback는 opacity 감소 대신 1px 이동과 `scale: 0.98`을 사용한다. label 색은 tone별로 지정하며 `selected`는 `brandSoft` 배경과 체크 의미를 accessibility state로 노출한다.

- [ ] **Step 5: GREEN 확인**

  Run: `npm test -- src/theme/__tests__/fonts.test.ts src/components/ui/__tests__/AppText.test.tsx src/components/ui/__tests__/AppButton.test.tsx --runInBand`

  Expected: PASS.

### Task 3: Page, form, section, and row primitives

**Files:**
- Create: `src/components/ui/AppInput.tsx`
- Create: `src/components/ui/AppPageHeader.tsx`
- Create: `src/components/ui/AppSection.tsx`
- Create: `src/components/ui/ListRow.tsx`
- Create: `src/components/ui/BottomActionBar.tsx`
- Create: `src/components/ui/InlineNotice.tsx`
- Create: `src/components/ui/__tests__/AppInput.test.tsx`
- Create: `src/components/ui/__tests__/AppPageHeader.test.tsx`
- Create: `src/components/ui/__tests__/ListRow.test.tsx`
- Create: `src/components/ui/__tests__/InlineNotice.test.tsx`
- Modify: `src/components/layout/ResponsivePage.tsx`
- Modify: `src/components/layout/__tests__/ResponsivePage.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `AppText`, `AppButton`; `useResponsiveLayout()`
- Produces: label/helper/error를 포함한 `AppInput`; `title`, `backHref`, `trailing`의 `AppPageHeader`; title/action/content의 `AppSection`; title/description/value/leading/trailing의 `ListRow`; safe-area-aware `BottomActionBar`; `info | success | warning | danger`의 `InlineNotice`

- [ ] **Step 1: 입력과 header 실패 테스트 작성**

  입력의 label·helper·error 연결, error accessibility state, header의 back 접근성 이름과 긴 제목 wrap, wide에서 선택적 back control을 검증한다.

- [ ] **Step 2: row와 notice 실패 테스트 작성**

  ListRow의 56px 최소 높이와 전체 행 press target, InlineNotice의 alert semantics와 색 외 icon/text 의미를 검증한다.

- [ ] **Step 3: ResponsivePage 배경·gutter 실패 테스트 보강 후 RED 확인**

  Run: `npm test -- src/components/ui/__tests__/AppInput.test.tsx src/components/ui/__tests__/AppPageHeader.test.tsx src/components/ui/__tests__/ListRow.test.tsx src/components/ui/__tests__/InlineNotice.test.tsx src/components/layout/__tests__/ResponsivePage.test.tsx --runInBand`

  Expected: 새 컴포넌트가 없어 FAIL.

- [ ] **Step 4: primitive와 ResponsivePage 구현**

  모든 primitive는 화면 route나 repository를 import하지 않는다. `BottomActionBar`는 bottom safe area와 콘텐츠 보정용 `minHeight`를 export하지 않고 자체 padding으로 처리한다.

- [ ] **Step 5: GREEN 확인**

  Run: `npm test -- src/components/ui/__tests__/AppInput.test.tsx src/components/ui/__tests__/AppPageHeader.test.tsx src/components/ui/__tests__/ListRow.test.tsx src/components/ui/__tests__/InlineNotice.test.tsx src/components/layout/__tests__/ResponsivePage.test.tsx --runInBand`

  Expected: PASS.

### Task 4: Snackbar and skeleton feedback

**Files:**
- Create: `src/components/ui/AppSnackbar.tsx`
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/__tests__/AppSnackbar.test.tsx`
- Create: `src/components/ui/__tests__/Skeleton.test.tsx`
- Modify: `src/providers/AppProviders.tsx`

**Interfaces:**
- Consumes: Task 1 semantic token과 motion, Task 2 `AppText`
- Produces: `SnackbarProvider`, `useSnackbar(): { show(message, options?): void; dismiss(): void }`; `Skeleton`의 `width`, `height`, `radius`, `reducedMotion` props

- [ ] **Step 1: Snackbar queue 실패 테스트 작성**

  provider 안에서 두 메시지를 연속 show하면 첫 메시지 뒤에 두 번째가 표시되고, action과 dismiss가 접근 가능하며 provider 밖 hook 사용은 명시적 오류를 내는지 검증한다.

- [ ] **Step 2: Skeleton reduced-motion 실패 테스트 작성 후 RED 확인**

  `reducedMotion`에서 정적 surface를 렌더하고 animation timer를 만들지 않으며 width/height/radius가 style에 적용되는지 검증한다.

  Run: `npm test -- src/components/ui/__tests__/AppSnackbar.test.tsx src/components/ui/__tests__/Skeleton.test.tsx --runInBand`

  Expected: 파일이 없어 FAIL.

- [ ] **Step 3: Snackbar와 Skeleton 구현 및 provider 연결**

  Snackbar는 private content를 자동 수집하거나 log하지 않고 caller가 준 짧은 문자열만 화면에 표시한다. queue는 FIFO이며 하나만 보인다.

- [ ] **Step 4: GREEN 확인**

  Run: `npm test -- src/components/ui/__tests__/AppSnackbar.test.tsx src/components/ui/__tests__/Skeleton.test.tsx --runInBand`

  Expected: PASS, 열린 timer 없음.

### Task 5: Compatibility integration, documentation, and single Issue commit

**Files:**
- Modify: `src/components/ui/Panel.tsx`
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/components/OfflineReadOnlyBanner.tsx`
- Modify: `app/_layout.tsx`
- Modify: `docs/progress.md`
- Modify: `docs/decisions.md`
- Modify: `docs/superpowers/plans/2026-10-06-toss-ui-foundation.md`

**Interfaces:**
- Consumes: Tasks 1~4의 Foundation API
- Produces: 기존 앱이 빌드되는 compatibility layer와 후속 화면 Issue가 사용할 완료된 공통 UI 계약

- [ ] **Step 1: 기존 공통 상태 화면 회귀 테스트를 RED 또는 기존 GREEN 기준으로 실행**

  Run: `npm test -- src/components src/theme --runInBand`

  Expected: 새 token 전환으로 드러난 회귀가 있으면 FAIL, 없으면 기존 기준 PASS를 기록하고 integration 변경 후 동일 명령으로 회귀를 검증한다.

- [ ] **Step 2: 공통 상태 UI와 root loading을 semantic primitive로 전환**

  Panel은 기본 shadow와 과한 border를 제거하고, EmptyState와 offline notice는 새 section/notice 계약을 사용한다. root loading은 background와 skeleton을 사용하되 인증 route 판단은 바꾸지 않는다.

- [ ] **Step 3: 문서와 plan checkbox 갱신**

  `docs/progress.md`에는 Foundation만 실제 구현으로 기록하고 개별 화면 전환은 남은 작업으로 둔다. `docs/decisions.md`에는 legacy alias를 한시적으로 유지하는 이유와 light-theme 우선 결정을 기록한다.

- [ ] **Step 4: 전체 검증**

  Run: `npm run typecheck && npm run lint && npm test -- --runInBand && npm run build:web && npm run verify:web:export`

  Expected: 모두 exit 0. 실제 iOS·Android 기기 검증은 별도 결과로 남긴다.

- [ ] **Step 5: Issue #124 단일 구현 commit**

  ```bash
  git add assets src app docs
  git commit -m "feat: add toss-style UI foundation"
  ```
