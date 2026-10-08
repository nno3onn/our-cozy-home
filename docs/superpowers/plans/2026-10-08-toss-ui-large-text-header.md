# 큰 글자 페이지 헤더 보강 계획

## 목표

320px compact 화면에서 200% 글자 확대를 사용해도 뒤로가기, 긴 제목과 trailing action이 겹치거나 잘리지 않게 한다.

## 구현 순서

1. 320px, `fontScale: 2` 조건에서 trailing action이 별도 전체 폭 행으로 이동해야 하는 테스트를 추가한다.
2. `AppPageHeader`가 breakpoint와 font scale을 함께 읽고 큰 글자 compact 레이아웃을 선택하게 한다.
3. 제목의 무제한 줄바꿈과 44pt 뒤로가기 target, 일반 compact·wide 계약을 유지한다.
4. 전체 정적 검사, 테스트와 web export를 실행하고 실제 기기 미검증 범위를 기록한다.

## 제외 범위

- 시스템 글자 확대 제한 또는 개별 제목 축약
- 페이지별 별도 header 구현
- 실제 iOS/Android 접근성 글자 크기 검증 완료 주장
