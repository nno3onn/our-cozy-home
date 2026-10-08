# Bottom sheet 접근성 보강 계획

## 목표

공통 `HouseOverlay`가 모션 감소, 큰 글자, 작은 화면과 하단 safe area를 존중하도록 보강한다.

## 구현 순서

1. reduced motion에서 정적 전환, 일반 설정에서 slide 전환, dialog 역할과 스크롤 영역을 요구하는 테스트를 먼저 추가한다.
2. Reanimated의 시스템 reduced-motion 값을 사용해 `Modal.animationType`을 결정한다.
3. sheet에 dialog 의미와 bottom safe area를 적용하고, 내용 영역을 스크롤 가능하게 만든다.
4. 기존 바깥 영역·닫기 버튼·하드웨어 뒤로가기 dismiss 동작을 회귀 검증한다.
5. 정적 검사, 전체 테스트와 web export를 실행하고 실제 기기 미검증 범위를 기록한다.

## 제외 범위

- 각 overlay 내부의 게임 규칙, RPC, 데이터 변경
- 새로운 장식 animation 추가
- 실제 iOS/Android screen reader 및 키보드 검증 완료 주장
