# [Backend Foundation] Supabase 로컬 개발 환경과 마이그레이션 실행 기반 구축

## 목적

Supabase 스키마·RPC·RLS를 재현하고 검증할 수 있는 CLI·migration 기반을 만들고, Docker를
사용할 수 없는 개발 환경에서는 원격 프로젝트 연결로 다음 단계의 실제 통합 검증을 시작한다.

## 배경 / 현재 상태

앱과 데모 repository는 실행되지만 `supabase/` 디렉터리, CLI 설정, 로컬 DB 실행 및 SQL 테스트 명령은 없다. README의 Supabase 안내도 향후 작업으로만 적혀 있다.

## 선행 작업

없음

## 구현 범위

- Supabase CLI 설정과 `supabase/config.toml`을 추가한다.
- 추가 전용 migration, 멱등 seed, SQL/pgTAP 테스트 디렉터리 규칙을 정한다.
- 로컬 start/reset/status, migration 적용, seed, 테스트 명령을 npm script와 README에 연결한다.
- `.env.example`에 로컬/원격 연결 값을 구분해 문서화한다.
- 원격 프로젝트의 URL·publishable key는 추적하지 않는 `.env`로만 설정하고, health와
  publishable-key 요청으로 연결을 확인한다.

## 상세 요구사항

- 앱 시작이나 일반 빌드가 DB reset을 실행하지 않아야 한다.
- 로컬 reset은 명시적 개발 명령에서만 수행한다.
- Node/CLI/Docker 요구사항과 실패 복구 절차를 기록한다.
- 이후 migration은 이미 적용한 파일을 수정하지 않고 새 파일로 추가한다.
- Docker가 없는 환경에서는 local start/reset/test를 실행하지 않고, 그 미검증 사실을
  `docs/progress.md`에 남긴다. 이는 원격 연결 검증과 구분한다.

## 보안 / 권한

앱에는 publishable key만 노출한다. service role과 외부 서비스 비밀은 예제 파일에도 실제 값을 넣지 않는다.

## 동시성 / 멱등성

seed는 반복 실행해도 기준 데이터가 중복되지 않아야 한다. 동시성 테스트는 별도 DB 연결을 사용할 수 있는 골격을 제공한다.

## 제외 범위

도메인 테이블, 게임 RPC, 실제 Supabase repository, 로컬 Docker daemon 설치는 구현하지 않는다.

## 테스트

- 자동화: config 유효성 검사와 앱의 타입·lint·회귀 테스트를 실행한다.
- 실제 환경: 원격 Supabase Auth health와 publishable key Data API 요청을 확인한다.
- 보류 검증: Docker가 제공되는 환경에서의 `supabase start`, reset, seed 재실행, SQL test는
  별도 운영 검증으로 남긴다.

## 완료 조건

- [x] Supabase CLI, `config.toml`, 추가 전용 migration·seed·SQL test 디렉터리와 명령이 있다.
- [x] 원격 프로젝트 URL·publishable key를 로컬 `.env`에만 설정하고, Auth health와
  publishable key Data API 요청을 확인했다.
- [x] Node 20.19.4 이상 요구사항과 Docker local 검증의 보류 상태를 README·진행 문서에 기록했다.
- [x] 타입 검사, Node 22.14.0 lint, 43개 Jest 회귀 테스트와 Supabase 환경 웹 export를 실행했다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
