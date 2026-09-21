# [E2E Verification] 데이터베이스 동시성·RLS·Storage 회귀 스위트 완성

## 목적

첫 버전의 핵심 무결성과 비공개 접근 정책을 로컬 Supabase에서 반복 실행 가능한 자동화 스위트로 검증한다.

## 배경 / 현재 상태

각 기능 Issue에 국소 SQL 테스트가 생기지만 전체 교차 기능 경쟁과 권한 행렬을 한 번에 검증하는 release gate가 없다.

## 선행 작업

027-account-deletion-and-author-anonymization.md

## 구현 범위

- pgTAP/SQL 권한 스위트와 별도 DB connection 동시성 harness를 정리한다.
- CI/로컬에서 schema reset→seed→DB test를 독립 실행하도록 한다.
- 명세의 핵심 무결성·RLS·Storage 시나리오를 release matrix로 매핑한다.
- 실패 재현을 위한 안전한 test fixture와 시간/KST 제어 helper를 제공한다.

## 상세 요구사항

- 출석 하루 한 번, 동시 구매 음수 방지, 활성 집 하나, 최대 4명을 검증한다.
- 마지막 자리와 두 집 동시 수락은 반드시 서로 다른 연결에서 경합한다.
- 탈퇴 접근 차단, 두 명 완성/가구 하나, 후입주자/퇴장 cutoff/삭제 전파를 검증한다.
- 같은 날짜 학습 중복 방지와 3일 획득, 배치+탈퇴 일관성을 검증한다.
- 다른 사용자 private row와 Storage object 접근 거부, 계정 삭제 타인 데이터 보존을 검증한다.

## 보안 / 권한

anon 및 여러 authenticated JWT context를 사용한다. service role만 사용한 성공 테스트로 RLS 통과를 주장하지 않는다.

## 동시성 / 멱등성

핵심 범위다. 단일 session 순차 호출은 동시성 검증으로 세지 않으며 barrier/parallel connection으로 실제 경합을 만든다.

## 제외 범위

실제 원격 Supabase, Expo Push, 브라우저/모바일 UI E2E는 031에서 수행한다.

## 테스트

- 자동화: 위 전체 행렬을 단일 release 명령과 CI job으로 실행하고 flaky 없이 반복 검증한다.
- 실제 환경: 로컬 Docker/Postgres에서 병렬 connection 수와 테스트 결과를 기록한다.

## 완료 조건

- [ ] 명세 핵심 DB 규칙에 자동화 테스트 ID가 대응된다.
- [ ] 실제 병렬 연결로 경합 테스트가 실행된다.
- [ ] RLS와 Storage의 허용/거부 양쪽이 검증된다.
- [ ] 한 명령과 CI에서 재현 가능하다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
