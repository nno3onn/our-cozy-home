# Toss-style Commerce UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상점·보관함·꾸미기 트레이를 기존 구매·소유권·배치 계약을 유지한 채 토스식 정보 계층과 반응형 구조로 전환한다.

**Architecture:** 카탈로그와 repository는 계속 서버 데이터의 최종 기준이다. 화면은 Foundation header, section, notice, snackbar와 catalog card를 사용하며 구매/배치 결과만 mutation 성공 뒤 표시한다.

**Tech Stack:** Expo Router, React Native, TypeScript, TanStack Query, Jest

**Spec:** `docs/superpowers/specs/2026-10-06-toss-style-ui-system-design.md`

## Global Constraints

- 상점 40종과 기존 category/filter를 유지한다.
- compact 2열(360px 미만 1열), medium 3열, wide 4열을 사용한다.
- 구매 가격·잔액·소유권과 배치 version은 서버 결과를 신뢰한다.
- 오프라인에서 읽기는 유지하고 구매·배치를 제한한다.
- 방 scene 좌표와 에셋은 변경하지 않는다.

## Review Focus

- 390px에서 40개 상품이 2열로 표시되고 카드가 가로 overflow를 만들지 않는다.
- 코인 부족 오류는 현재·가격·부족 금액을 모두 서버 details로 표시한다.
- 알 수 없는 구매 결과는 완료로 단정하지 않고 기존 복구 조회를 유지한다.
- 친구 소유 가구는 소유자를 표시하되 선택·배치할 수 없다.
- wide 꾸미기는 방과 360–420px 패널을 함께 유지한다.

### Task 1: Catalog grid and shop feedback

**Files:** `src/components/layout/ResponsiveGrid.tsx`, `src/features/illustrated-ui/catalog/CategoryChips.tsx`, `src/features/illustrated-ui/catalog/ShopItemCard.tsx`, `src/features/shop/screens/ShopScreen.tsx`, 관련 tests

- [x] 390/768/1280 열 수와 코인 부족 상세·구매 성공 snackbar 실패 테스트를 작성하고 RED를 확인한다.
- [x] horizontal category, neutral item card, 구매 확인 sheet, 상세 금액 notice와 snackbar를 구현한다.
- [x] shop tests를 GREEN으로 만든다.

### Task 2: Inventory and decorate tray

**Files:** `src/features/inventory/screens/InventoryScreen.tsx`, `src/features/decorate/components/DecorateTray.tsx`, `src/features/decorate/screens/DecorateScreen.tsx`, 관련 tests

- [x] 보관함 이미지·수량·소유권, tray 선택 상태·유일한 배치 CTA의 실패 테스트를 작성하고 RED를 확인한다.
- [x] inventory grid와 compact/wide tray를 Foundation 스타일로 구현한다.
- [x] inventory/decorate tests를 GREEN으로 만든다.

### Task 3: Verification and delivery

**Files:** `docs/progress.md`, `docs/decisions.md`, 이 plan

- [x] typecheck, lint, 전체 Jest, Demo web export와 SPA 검사를 실행한다.
- [x] 미검증 viewport와 iOS/Android 항목을 문서에 구분한다.
- [x] 단일 commit, PR, merge, Issue #130 close를 수행한다.
