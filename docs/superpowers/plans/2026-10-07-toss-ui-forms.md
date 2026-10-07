# Toss-style Entry Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인부터 초대 수락 또는 새 집 생성까지 이어지는 첫 사용자 흐름을 Foundation 컴포넌트와 토스식 정보 계층으로 전환한다.

**Architecture:** `ResponsiveFormPage`는 중립 배경·키보드·폭만 책임지고, 각 화면은 `AppPageHeader`, `AppInput`, `InlineNotice`, `BottomActionBar`로 제목·입력·오류·주요 행동을 구성한다. Auth context, repository, RPC, idempotency key와 Expo Router 경로는 유지한다.

**Tech Stack:** Expo Router, React Native, TypeScript, React Native Testing Library, Jest

**Spec:** `docs/superpowers/specs/2026-10-06-toss-style-ui-system-design.md`

## Global Constraints

- 한 화면의 강조 primary CTA는 하나만 둔다.
- 실패해도 이메일·이름·초대 코드 등 사용자가 입력한 값은 유지한다.
- 입력은 placeholder 대신 항상 보이는 label을 가진다.
- 뒤로가기는 compact/medium에서 제목과 같은 행, wide에서는 기본 숨김이다.
- Demo Mode, Supabase Auth, 집 RPC, 초대 멱등성, route slug를 변경하지 않는다.
- 네이티브 44pt touch target과 320px 최소 폭을 유지한다.

## Review Focus

- 키보드가 열려도 마지막 입력과 primary CTA가 같은 scroll flow 안에서 접근 가능해야 한다.
- 서버 오류와 validation 오류가 `alert` semantics로 읽히며 입력값을 지우지 않아야 한다.
- 로그인 전에 받은 초대 token이 로그인 화면을 거쳐도 기존 AuthProvider 경로로 유지돼야 한다.
- 정원 초과·만료·취소·이미 집 보유 상태를 성공처럼 표시하거나 자동 재시도하지 않아야 한다.
- wide 화면에서 form을 과도하게 넓히거나 모바일 back button 자리를 비워두지 않아야 한다.

---

### Task 1: Neutral responsive form shell

**Files:**
- Modify: `src/components/layout/ResponsiveFormPage.tsx`
- Modify: `src/components/layout/__tests__/ResponsivePage.test.tsx`

**Interfaces:**
- Consumes: `ResponsivePage`, `getResponsiveLayout`, semantic tokens
- Produces: 카드 그림자 없이 최대 폭 640의 keyboard-safe form column

- [x] form page가 surface card를 강제하지 않고 320/1280에서 중앙 열과 bottom safe space를 유지하는 실패 테스트를 작성한다.
- [x] `npm test -- src/components/layout/__tests__/ResponsivePage.test.tsx --runInBand`로 RED를 확인한다.
- [x] `ResponsiveFormPage`의 cream card·border·shadow를 제거하고 neutral scroll/content 간격을 구현한다.
- [x] 같은 명령으로 GREEN을 확인한다.

### Task 2: Sign-in and sign-up screens

**Files:**
- Modify: `app/auth/sign-in.tsx`
- Modify: `app/auth/sign-up.tsx`
- Create: `src/auth/__tests__/AuthEntryScreens.test.tsx`

**Interfaces:**
- Consumes: `AppPageHeader`, `AppInput`, `InlineNotice`, `AppButton`, `ResponsiveFormPage`, 기존 `useAuth`
- Produces: label 기반 이메일/비밀번호 입력, 단일 primary CTA, tertiary 계정 전환 link

- [x] 로그인 실패 후 이메일·비밀번호가 유지되고 오류 alert가 보이는 실패 테스트를 작성한다.
- [x] 회원가입의 6자 미만 비밀번호 CTA 비활성과 서버 오류 보존 실패 테스트를 작성한다.
- [x] 대상 테스트로 RED를 확인한 뒤 두 route를 공통 primitive로 구현한다.
- [x] 대상 테스트와 기존 auth tests로 GREEN을 확인한다.

### Task 3: Onboarding screen

**Files:**
- Modify: `app/onboarding.tsx`
- Create: `src/auth/__tests__/OnboardingScreen.test.tsx`

**Interfaces:**
- Consumes: 기존 `validateOnboarding`, `completeOnboarding`; Foundation input/button/notice
- Produces: 이름·동물·point color section, 접근 가능한 종 선택, `이름표와 내 가구 표시 색` 설명

- [x] 빈 이름 validation과 API 오류 뒤 입력 보존, 선택 동물 accessibility state, point color 설명 실패 테스트를 작성한다.
- [x] RED 확인 후 화면을 section·swatch·AppInput·단일 primary CTA로 구현한다.
- [x] onboarding validation/status와 화면 테스트로 GREEN을 확인한다.

### Task 4: House choice, creation, and invite states

**Files:**
- Modify: `src/features/house/screens/HouseEntryChoiceScreen.tsx`
- Modify: `src/features/house/screens/HouseCreateScreen.tsx`
- Modify: `src/features/house/screens/InviteAcceptanceControls.tsx`
- Modify: `app/invite/[token].tsx`
- Modify: related tests under `src/features/house/screens/__tests__`

**Interfaces:**
- Consumes: 기존 token parsing, create/accept callbacks와 request id; Foundation primitives
- Produces: 새 집 primary와 초대 secondary hierarchy, skeleton preview, 상태별 InlineNotice와 복구 행동

- [x] 집 선택에서 primary CTA가 하나이고 초대 입력 오류가 alert인지 테스트한다.
- [x] 집 생성 실패와 기존 집 상태가 입력을 보존하는지 테스트한다.
- [ ] 초대 full/expired/cancelled/offline 상태의 route-level 시각 테스트는 localhost 브라우저 차단으로 후속 검증한다. full·invalid·offline 제어 테스트와 기존 상태별 문구는 유지한다.
- [x] RED 확인 후 대상 화면을 구현하고 관련 house tests로 GREEN을 확인한다.

### Task 5: Verification, documentation, and delivery

**Files:**
- Modify: `docs/progress.md`
- Modify: `docs/decisions.md`
- Modify: this plan

**Interfaces:**
- Consumes: Tasks 1–4
- Produces: Issue #126의 검증 원장과 단일 commit

- [x] `npm run typecheck && npm run lint && npm test -- --runInBand --no-watchman --forceExit`를 실행한다.
- [x] Demo Mode web export와 artifact 검사를 실행한다.
- [ ] 320×700, 390×844, 768×1024, 1280×800에서 인증·온보딩·집 선택 화면의 overflow, header, 입력, CTA를 확인한다.
- [x] 실제 iOS/Android 미검증을 문서에 분리한다.
- [x] `feat: refine toss-style entry forms` 단일 commit, PR, merge, Issue #126 close를 수행한다.
