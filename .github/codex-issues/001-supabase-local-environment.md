# [Backend Foundation] Supabase 로컬 개발 환경과 마이그레이션 실행 기반 구축

## 목적

Supabase 스키마·RPC·RLS를 누구나 같은 방식으로 재현하고 검증할 수 있는 로컬 개발 기반을 만든다.

## 배경 / 현재 상태

앱과 데모 repository는 실행되지만 `supabase/` 디렉터리, CLI 설정, 로컬 DB 실행 및 SQL 테스트 명령은 없다. README의 Supabase 안내도 향후 작업으로만 적혀 있다.

## 선행 작업

없음

## 구현 범위

- Supabase CLI 설정과 `supabase/config.toml`을 추가한다.
- 추가 전용 migration, 멱등 seed, SQL/pgTAP 테스트 디렉터리 규칙을 정한다.
- 로컬 start/reset/status, migration 적용, seed, 테스트 명령을 npm script와 README에 연결한다.
- `.env.example`에 로컬/원격 연결 값을 구분해 문서화한다.

## 상세 요구사항

- 앱 시작이나 일반 빌드가 DB reset을 실행하지 않아야 한다.
- 로컬 reset은 명시적 개발 명령에서만 수행한다.
- Node/CLI/Docker 요구사항과 실패 복구 절차를 기록한다.
- 이후 migration은 이미 적용한 파일을 수정하지 않고 새 파일로 추가한다.

## 보안 / 권한

앱에는 publishable key만 노출한다. service role과 외부 서비스 비밀은 예제 파일에도 실제 값을 넣지 않는다.

## 동시성 / 멱등성

seed는 반복 실행해도 기준 데이터가 중복되지 않아야 한다. 동시성 테스트는 별도 DB 연결을 사용할 수 있는 골격을 제공한다.

## 제외 범위

도메인 테이블, 게임 RPC, 원격 Supabase 프로젝트 생성은 구현하지 않는다.

## 테스트

- 자동화: config 유효성 검사, 로컬 reset 후 seed 재실행, 빈 SQL 테스트 스위트 실행을 확인한다.
- 실제 환경: Docker가 있는 개발 환경에서 `supabase start`, reset, test를 실행한다. 원격 프로젝트는 검증 대상이 아니다.

## 완료 조건

- [ ] 새 clone에서 문서의 명령만으로 로컬 Supabase가 시작된다.
- [ ] migration과 seed가 반복 가능하다.
- [ ] SQL 테스트 명령이 CI 친화적인 종료 코드를 반환한다.
- [ ] README와 `docs/progress.md`에 실제 검증 결과가 기록된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
