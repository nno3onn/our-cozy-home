# 우리집 Codex Issue 실행 목록

이 디렉터리는 현재 구현된 Expo 웹·모바일 Demo Mode 기반을 재작성하지 않고, 제품 명세의 첫 버전을 실제 Supabase와 프로덕션 환경까지 완성하기 위한 작업 명세다. 각 번호 파일은 하나의 branch/PR에서 닫을 수 있는 범위를 목표로 하며 번호 순서가 기본 실행 순서다. 병렬 작업은 표의 선행 Issue가 모두 완료된 경우에만 진행한다.

## Phase별 수량

| Phase | 이름 | Issue 수 |
| --- | --- | ---: |
| Phase 1 | Backend Foundation | 3 |
| Phase 2 | Authentication & Profile | 2 |
| Phase 3 | House & Invite | 4 |
| Phase 4 | Security | 2 |
| Phase 5 | Economy & Shop | 3 |
| Phase 6 | Room | 2 |
| Phase 7 | Memories | 5 |
| Phase 8 | Habit | 2 |
| Phase 9 | Realtime & Notification | 3 |
| Phase 10 | Account Lifecycle | 1 |
| Phase 11 | Web Production & Quality | 2 |
| Phase 12 | E2E Verification | 2 |
|  | **합계** | **31** |

## 전체 실행 순서

| 순서 | Phase | Issue 제목 | 파일명 | 선행 Issue |
| ---: | --- | --- | --- | --- |
| 001 | Phase 1 Backend Foundation | [Backend Foundation] Supabase 로컬 개발 환경과 마이그레이션 실행 기반 구축 | `001-supabase-local-environment.md` | 없음 |
| 002 | Phase 1 Backend Foundation | [Backend Foundation] 핵심 스키마와 생성 Database 타입 도입 | `002-core-schema-and-generated-types.md` | 001 |
| 003 | Phase 1 Backend Foundation | [Backend Foundation] Supabase 클라이언트와 실제 Repository 기반 연결 | `003-supabase-repository-foundation.md` | 002 |
| 004 | Phase 2 Authentication & Profile | [Authentication] Supabase Auth 세션과 인증 라우팅 구현 | `004-auth-session-and-route-guards.md` | 003 |
| 005 | Phase 2 Authentication & Profile | [Authentication] 프로필과 개인 동물 온보딩 연결 | `005-profiles-and-animal-onboarding.md` | 004 |
| 006 | Phase 3 House & Invite | [House] 집 생성과 최초 멤버십 RPC 연결 | `006-house-create-and-active-membership.md` | 005 |
| 007 | Phase 3 House & Invite | [House] 24시간 다중 사용 초대와 개인정보 최소 미리보기 구현 | `007-invite-lifecycle-and-preview.md` | 006 |
| 008 | Phase 3 House & Invite | [House] 초대 수락 이력과 최대 4명 동시 입주 구현 | `008-invite-acceptance-concurrency.md` | 007 |
| 009 | Phase 3 House & Invite | [House] 집 나가기·집장 승계·마지막 멤버 보관 처리 | `009-house-leave-and-admin-succession.md` | 008 |
| 010 | Phase 4 Security | [Security] 핵심 테이블 RLS와 권한 상승 RPC 강화 | `010-database-rls-and-rpc-hardening.md` | 009 |
| 011 | Phase 4 Security | [Security] 비공개 추억 사진 버킷과 Storage 권한 기반 구축 | `011-private-memory-storage-policy.md` | 010 |
| 012 | Phase 5 Economy & Shop | [Economy] 개인 지갑·거래 원장과 한국 날짜 출석 보상 구현 | `012-wallet-ledger-and-attendance.md` | 010 |
| 013 | Phase 5 Economy & Shop | [Economy] 55종 서버 카탈로그 seed와 실제 상점 조회 연결 | `013-catalog-seed-and-live-shop.md` | 012 |
| 014 | Phase 5 Economy & Shop | [Economy] 멱등 구매 RPC와 개인 인벤토리 연결 | `014-idempotent-purchase-and-inventory.md` | 013 |
| 015 | Phase 6 Room | [Room] 공동 방 배치 RPC와 낙관적 동시성 구현 | `015-room-placement-concurrency.md` | 014 |
| 016 | Phase 6 Room | [Room] 실제 방 Snapshot과 오프라인 읽기 전용 복구 연결 | `016-live-room-and-offline-readonly.md` | 015 |
| 017 | Phase 7 Memories | [Memories] 비공개 초안과 공동 추억 공유 대상 고정 | `017-memory-drafts-and-sharing.md` | 016 |
| 018 | Phase 7 Memories | [Memories] 기여 Revision과 탈퇴 시점 열람 범위 구현 | `018-memory-contributions-and-access-snapshots.md` | 017 |
| 019 | Phase 7 Memories | [Memories] 두 명 기여 완성과 추억 가구 멱등 생성 | `019-memory-completion-and-furniture.md` | 018 |
| 020 | Phase 7 Memories | [Memories] 추억 이미지 압축·업로드·서명 URL·삭제 복구 | `020-memory-photo-lifecycle.md` | 011, 018 |
| 021 | Phase 7 Memories | [Memories] 실제 추억 목록·작성·상세·개인 보관함 사용자 흐름 완성 | `021-live-memory-user-flows.md` | 019, 020 |
| 022 | Phase 8 Habit | [Habit] 동물 쌍 버릇 학습과 서로 다른 3일 획득 규칙 구현 | `022-habit-learning-transactions.md` | 019 |
| 023 | Phase 8 Habit | [Habit] 버릇 학습 선택·진행·획득 화면과 동물 행동 연결 | `023-live-habit-experience.md` | 022 |
| 024 | Phase 9 Realtime & Notification | [Realtime] 집 단위 구독과 재연결 Refetch 관리 | `024-realtime-subscriptions-and-refetch.md` | 016, 021, 023 |
| 025 | Phase 9 Realtime & Notification | [Notification] 알림 권한·Expo Push Token과 안전한 화면 이동 구현 | `025-push-token-and-notification-routing.md` | 004, 021 |
| 026 | Phase 9 Realtime & Notification | [Notification] 권한 기반 알림 Outbox와 Expo Push 발송 구현 | `026-notification-outbox-and-delivery.md` | 008, 019, 022, 025 |
| 027 | Phase 10 Account Lifecycle | [Account Lifecycle] 멱등 계정 삭제와 공동 기록 작성자 비식별화 | `027-account-deletion-and-author-anonymization.md` | 009, 020, 026 |
| 028 | Phase 11 Web Production & Quality | [Web Production] 웹 딥 링크·SPA Rewrite와 프로덕션 배포 구성 | `028-web-deep-links-and-production-hosting.md` | 008, 025 |
| 029 | Phase 11 Web Production & Quality | [Quality] 전체 실제 화면 반응형·접근성·모션 감소 검증 | `029-responsive-accessibility-and-reduced-motion.md` | 023, 025, 028 |
| 030 | Phase 12 E2E Verification | [E2E Verification] 데이터베이스 동시성·RLS·Storage 회귀 스위트 완성 | `030-database-concurrency-and-security-suite.md` | 027 |
| 031 | Phase 12 E2E Verification | [E2E Verification] 실제 Supabase 다계정과 프로덕션 웹 Smoke 검증 | `031-production-e2e-verification.md` | 026, 028, 029, 030 |

## 병렬 진행 가능한 지점

- 010 완료 후 011(Storage 기반)과 012(경제)는 병렬 가능하다.
- 019 완료 후 020의 나머지 사진 작업과 022(버릇 서버 규칙)는 병렬 가능하다.
- 021과 023 완료 이후 024(Realtime), 025(알림 client), 028(웹 배포 준비)는 각 선행 조건을 만족하면 병렬 가능하다.
- 031은 기능 구현과 자동화 release gate가 모두 끝난 후 수행한다.

## 이미 구현되어 별도 Issue로 만들지 않은 범위

- Expo SDK 57 + React Native + TypeScript + Expo Router 프로젝트 초기화
- 명시적 Demo Mode와 자동 Supabase fallback 방지
- 1~4명 논리 좌표/4인 방, 같은 종 동물 구별, 동물 터치와 일반 행동 버튼
- 웹 View/네이티브 Skia 방 렌더러 기반, 레이어·hit target 테스트
- 데모 고정 슬롯 가구 교체와 placement version 계약
- 데모 추억 목록·상세 및 방 추억 가구에서 상세 열기
- 40종 상점·15종 추억 가구 TypeScript 카탈로그와 개발용 에셋 갤러리
- 디자인 토큰, 공통 접근성 UI, 앱 생명주기 hook, 데모 초기화
- Expo 웹 export와 390px/1280px 데모 화면 검증 기반

위 기반은 후속 Issue의 회귀 대상이다. 서버 seed, 실제 데이터 연결, 최종 에셋과 플랫폼별 실제 검증은 완료된 것으로 간주하지 않는다.
