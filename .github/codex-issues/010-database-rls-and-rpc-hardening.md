# [Security] 핵심 테이블 RLS와 권한 상승 RPC 강화

## 목적

화면 숨김이 아닌 DB 경계에서 집 소속·개인 소유권을 강제하고 권한 높은 함수를 안전하게 제한한다.

## 배경 / 현재 상태

초기 schema는 기본 거부 상태지만 집·프로필·동물·초대·경제/방 기반 테이블의 완전한 허용 행렬과 함수 권한 감사가 필요하다.

## 선행 작업

009-house-leave-and-admin-succession.md

## 구현 범위

- 현재까지 추가된 모든 테이블의 SELECT/INSERT/UPDATE/DELETE 정책을 작성한다.
- 활성 집 소속, 본인 프로필/동물/아이템, admin 역할별 helper 함수를 정의한다.
- 모든 `security definer` RPC의 `auth.uid()`, 고정 `search_path`, revoke/grant를 감사한다.
- 탈퇴 직후 이전 집 접근 차단과 클라이언트의 직접 잔액·소유권·역할 변경 차단을 검증한다.

## 상세 요구사항

- membership 이력 자체가 현재 접근 권한이 되지 않으며 active 상태만 집 조회에 사용한다.
- 익명 미리보기는 007의 제한된 RPC 외 private table을 읽지 못한다.
- 사용자 입력 ID를 권한 근거로 사용하지 않는다.
- 이후 도메인 migration이 따라야 할 정책 체크리스트를 문서화한다.

## 보안 / 권한

이 Issue의 핵심 범위다. anon/authenticated/service role 경계와 테이블별 허용·거부 매트릭스를 저장소에 남긴다.

## 동시성 / 멱등성

RLS는 동시성 해결 수단이 아니다. 기존 RPC 잠금/제약을 훼손하지 않는 회귀 테스트를 포함한다.

## 제외 범위

추억 전용 viewer 정책과 Storage object 정책은 017~020 및 011에서 상세 구현한다.

## 테스트

- 자동화: 여러 JWT 역할로 타 사용자/타 집 조회·변경 거부, 본인 허용, 직접 privilege 우회를 SQL로 검증한다.
- 실제 환경: local anon/publishable key에서 앱이 필요한 조회만 가능한지 확인한다.

## 완료 조건

- [ ] 현재 schema 전체에 명시적 RLS 정책이 있다.
- [ ] 탈퇴자는 이전 집 행을 읽거나 변경할 수 없다.
- [ ] client가 잔액·소유권·집장 역할을 직접 바꾸지 못한다.
- [ ] 권한 함수의 실행 권한과 search path가 제한된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
