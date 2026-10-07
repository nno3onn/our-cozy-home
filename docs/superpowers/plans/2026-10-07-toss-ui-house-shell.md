# Toss-style House Shell Implementation Plan

**Goal:** 방 장면을 유지하면서 우리집 chrome, 멤버 행, 탐색, 동물 상태와 상세 sheet를 Foundation 계층으로 전환한다.

## 범위

- [x] 집 이름·`n/4`·코인·설정만 보이는 중립 헤더
- [x] 멤버 네 자리와 빈자리 초대의 중복 문구 제거
- [x] 하단 탭/데스크톱 rail의 semantic selected 상태
- [x] 동물 상태 prompt와 상세 sheet의 상태·행동·오류 계층화
- [x] loading skeleton과 공통 overlay 표현
- [x] 테스트·typecheck·lint·web export·문서 갱신
- [x] 한 commit, PR, merge, Issue #128 close

## 유지 계약

- 방 좌표, 동물·가구 에셋, repository와 RPC를 변경하지 않는다.
- 네 동물 이름표와 터치 영역은 RoomCanvas의 동일 scene transform을 유지한다.
- 오프라인에서는 저장 행동을 계속 제한한다.
- 실제 iOS/Android 결과는 별도 검증한다.
