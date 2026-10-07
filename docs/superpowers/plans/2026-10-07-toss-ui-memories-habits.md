# Toss-style Memories & Habits UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 추억과 버릇 학습 화면을 서버 권한·완성 규칙을 유지한 채 Foundation 정보 계층과 반응형 UI로 전환한다.

**Architecture:** repository query 결과를 유일한 서버 상태로 유지한다. 화면은 추억 접근 범위, 기여 수, 가구 완성 여부와 동물 쌍별 3일 학습 진행을 표현만 하며 규칙을 재계산하지 않는다.

**Tech Stack:** Expo Router, React Native, TypeScript, TanStack Query, Jest

**Spec:** `docs/superpowers/specs/2026-10-06-toss-style-ui-system-design.md`

## Task 1: Memory list and detail

- [x] 가구 완성 상태·개인 보관함 범위·상세 기여 목록 테스트를 RED로 확인한다.
- [x] 목록 카드, 월 section, 상세 header/section/notice를 Foundation으로 전환한다.
- [x] 관련 테스트를 GREEN으로 만든다.

## Task 2: Composer and habit learning

- [x] 공유 대상·입력 유지·동물 쌍·3일 progress 테스트를 RED로 확인한다.
- [x] composer form과 habit progress list를 구현한다.
- [x] 관련 테스트를 GREEN으로 만든다.

## Task 3: Verification and delivery

- [x] typecheck, lint, 전체 Jest, Demo web export와 SPA 검사를 실행한다.
- [x] 문서에 검증/미검증 범위를 기록한다.
- [x] 단일 commit, PR, merge, Issue #132 close를 수행한다.
