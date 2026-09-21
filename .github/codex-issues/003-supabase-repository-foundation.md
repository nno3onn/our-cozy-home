# [Backend Foundation] Supabase 클라이언트와 실제 Repository 기반 연결

## 목적

명시적 Supabase 모드가 실제 클라이언트와 생성 DB 타입을 사용하도록 하되 Demo Mode와 같은 도메인 경계를 유지한다.

## 배경 / 현재 상태

`createRepository('supabase')`는 의도적으로 `not_configured`를 반환한다. 화면은 작은 `HomeRepository`에만 의존하고 TanStack Query provider는 이미 있다.

## 선행 작업

002-core-schema-and-generated-types.md

## 구현 범위

- 타입이 지정된 Supabase client factory와 세션 저장 adapter를 추가한다.
- 기능별 repository 계약과 안정적인 도메인 오류 매핑 규칙을 정리한다.
- 앱 루트에서 demo 또는 Supabase 구현을 한 곳에서 주입한다.
- 네트워크 실패 시 자동 Demo 전환 없이 연결/설정 오류를 표시한다.
- 사용자·집 범위 Query key factory와 캐시 정리 API를 만든다.

## 상세 요구사항

- 화면에 모드별 분기문을 흩뿌리지 않는다.
- DB 행을 생성 타입에서 도메인 타입으로 명시적으로 매핑한다.
- 인증 토큰, 초대 원문, 사진 경로를 로그에 남기지 않는다.
- 아직 구현하지 않은 repository 명령은 성공처럼 보이지 않는 명시적 오류를 반환한다.

## 보안 / 권한

앱 client는 publishable key와 사용자 세션만 사용한다. service role 사용 경로를 만들지 않는다.

## 동시성 / 멱등성

명령 계약에 `requestId`/멱등 키와 불확실한 결과 조회 상태를 표현할 수 있어야 한다. 실제 RPC는 후속 Issue에서 구현한다.

## 제외 범위

인증 화면과 도메인별 실제 RPC 구현은 제외한다.

## 테스트

- 자동화: 모드 주입, 환경 누락, row-to-domain 매핑, Demo 비회귀, 캐시 key 격리를 검증한다.
- 실제 환경: 로컬 Supabase URL/key로 client 초기화까지만 확인한다.

## 완료 조건

- [x] Supabase 모드가 실제 typed client를 구성한다.
- [x] 연결 실패가 Demo 성공으로 바뀌지 않는다.
- [x] repository와 Query key가 사용자/집 경계를 표현한다.
- [x] 기존 Demo 테스트와 앱 빌드가 유지된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
