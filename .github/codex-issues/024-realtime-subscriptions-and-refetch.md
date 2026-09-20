# [Realtime] 집 단위 구독과 재연결 Refetch 관리

## 목적

같은 집의 배치·멤버·추억 변경을 Realtime 신호로 받아 관련 Query를 갱신하고 생명주기 전환에서 구독을 안전하게 관리한다.

## 배경 / 현재 상태

앱 활성화 시 home query 무효화는 일부 구현됐지만 Supabase 채널, 기능별 key 무효화, 재연결 및 정리 관리자가 없다.

## 선행 작업

016-live-room-and-offline-readonly.md, 021-live-memory-user-flows.md, 023-live-habit-experience.md

## 구현 범위

- 집 단위 subscription manager와 table event→Query key 매핑을 구현한다.
- 멤버십, 배치, 추억/기여, 학습 사건에서 필요한 최소 query만 무효화한다.
- reconnect와 앱 active 복귀 시 전체 관련 데이터/권한을 refetch한다.
- 화면 종료·로그아웃·집 변경 시 채널/listener를 제거한다.

## 상세 요구사항

- Realtime payload를 최종 게임 상태로 사용하지 않고 DB 재조회 신호로만 사용한다.
- 동일 채널/handler가 중복 등록되지 않아야 한다.
- 연결 중단 중에는 016의 마지막 화면 읽기 전용 정책을 유지한다.
- 탈퇴 후 이전 집 event가 캐시를 되살리지 않아야 한다.

## 보안 / 권한

Realtime publication과 RLS가 허용된 행만 전달하도록 구성한다. 채널 이름이나 payload에 초대 원문/사진 경로를 포함하지 않는다.

## 동시성 / 멱등성

중복/순서 역전 event에도 refetch 결과가 최종 기준이다. invalidate 호출을 합쳐 과도한 재조회 폭주를 제한한다.

## 제외 범위

동물 매 프레임 위치 동기화, 푸시 알림은 제외한다.

## 테스트

- 자동화: event-key 매핑, 중복 구독 방지, reconnect/active refetch, 로그아웃/집 변경 cleanup을 검증한다.
- 실제 환경: 두 브라우저/기기 세션에서 배치·기여·입주 변경이 반대편에 반영되는지 확인한다.

## 완료 조건

- [ ] 집 변경 사건이 필요한 query를 갱신한다.
- [ ] 재연결/복귀 시 최신 권한과 상태를 재조회한다.
- [ ] 이전 집 구독과 캐시가 정리된다.
- [ ] Realtime 없이도 DB refetch로 일관성을 회복한다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
