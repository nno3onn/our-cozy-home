# [Memories] 비공개 초안과 공동 추억 공유 대상 고정

## 목적

혼자 작성한 기록을 private draft로 보관하고 작성자가 명시적으로 공유할 때 당시 집 멤버를 viewer/contributor로 고정한다.

## 배경 / 현재 상태

현재 추억은 DemoRepository의 읽기 전용 요약 하나뿐이다. 작성·초안·공유 schema와 권한이 없다.

## 선행 작업

016-live-room-and-offline-readonly.md

## 구현 범위

- `memories`, `memory_viewers` schema와 상태/공유 시각을 추가한다.
- private draft 생성·수정과 shared memory 시작/초안 공유 RPC를 구현한다.
- 작성 화면에 “현재 집 친구들에게 공유돼요”와 실제 대상 멤버를 표시한다.
- 공유 당시 membership에 viewer/contribute grant를 snapshot으로 저장한다.

## 상세 요구사항

- 첫 혼자 기록은 자동 공동 추억이 되지 않는다.
- 친구 입주 후에도 작성자의 명시적 공유가 필요하다.
- 처음부터 공동 추억을 시작해도 시작 시점 활성 멤버만 대상이다.
- 이후 입주자는 과거 추억 권한을 자동으로 얻지 않는다.
- 현재 멤버 중 viewer가 아닌 사람이 있으면 완성 가구는 공동 방에서 숨길 수 있는 조회 계약을 둔다.

## 보안 / 권한

private draft는 작성자만 읽고 변경한다. 공유 RPC는 현재 집과 membership을 서버에서 확인하고 viewer를 client 입력으로 임의 확장하지 않는다.

## 동시성 / 멱등성

동일 draft 공유 재시도는 viewer 행을 중복 생성하지 않고 같은 결과를 반환한다. 공유 시점 snapshot은 한 트랜잭션으로 고정한다.

## 제외 범위

기여 revision, 사진, 두 명 완성과 가구 생성은 후속 Issue다.

## 테스트

- 자동화: draft privacy, 공유 snapshot, 재시도, 후입주자 비포함, 타 집 멤버 거부를 SQL/UI 테스트로 검증한다.
- 실제 환경: 두 로컬 계정에서 초안→입주→명시적 공유와 대상 표시를 확인한다.

## 완료 조건

- [ ] 비공개 초안이 작성자에게만 보인다.
- [ ] 공유 시점 멤버십으로 viewer가 고정된다.
- [ ] 후입주자가 과거 추억을 자동 열람하지 못한다.
- [ ] 대상 멤버가 작성 화면에 명확히 표시된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
