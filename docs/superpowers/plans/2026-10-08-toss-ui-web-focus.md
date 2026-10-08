# 웹 키보드 포커스 계획

## 목표

웹의 공통 버튼과 입력 필드가 Tab 이동 시 동일한 semantic focus ring을 표시하도록 한다.

## 구현 순서

1. `AppButton`과 `AppInput`의 focus/blur 시각 상태를 요구하는 테스트를 먼저 추가한다.
2. 각 공통 control에서 focus 상태를 추적하고 2px brand outline을 적용한다.
3. 전달받은 onFocus/onBlur callback, disabled/selected/error와 label 계약을 유지한다.
4. 정적 검사, 전체 테스트와 web export를 실행하고 실제 브라우저 keyboard-only 검증 범위를 기록한다.

## 제외 범위

- 페이지별 tab order 및 focus trap 변경
- 새 icon 또는 third-party 접근성 라이브러리 도입
- native screen reader 검증 완료 주장
