# [Quality] 전체 실제 화면 반응형·접근성·모션 감소 검증

## 목적

새로 추가된 인증·상점·작성·학습·설정 화면까지 작은 화면, 키보드, 터치, 스크린리더와 reduced motion 요구를 일관되게 충족한다.

## 배경 / 현재 상태

데모 방은 390/1280px, 44pt 동물 hit target, 일반 행동 버튼과 reduced motion 일부를 갖췄다. 앞으로 추가될 실제 폼/목록/알림 화면의 전체 감사가 필요하다.

## 선행 작업

023-live-habit-experience.md, 025-push-token-and-notification-routing.md, 028-web-deep-links-and-production-hosting.md

## 구현 범위

- 전체 route의 mobile/desktop breakpoint, safe area, scroll/keyboard avoidance를 감사·보완한다.
- 아이콘 버튼, label/state/error, focus order와 최소 44pt 터치 영역을 검증한다.
- 색 외 사용자 구분, 대비, 동물 대체 행동을 유지한다.
- 시스템 reduced motion에서 반복 움직임/타이머를 중단하고 짧은 상태 피드백만 남긴다.

## 상세 요구사항

- 네 동물 이름/터치 영역과 버튼/패널이 좁은 화면에서도 겹치지 않는다.
- 입력 키보드가 제출 버튼과 오류 설명을 가리지 않는다.
- 로딩·빈·실패·오프라인·권한 거부 상태를 보조기술이 인식한다.
- background/inactive에서 불필요한 애니메이션·타이머를 멈춘다.
- 기존 완료된 데모 UI를 재작성하지 않고 회귀를 막는다.

## 보안 / 권한

접근성 label이나 오류 메시지에 초대 토큰·사진 경로·비공개 글을 노출하지 않는다.

## 동시성 / 멱등성

없음. 버튼 disabled만 서버 멱등성 대체로 간주하지 않는다는 회귀 검토를 포함한다.

## 제외 범위

최종 그래픽 제작, 완전한 WCAG 인증, 브라우저 전체 조합 인증은 제외한다.

## 테스트

- 자동화: 핵심 route의 role/name/state, keyboard layout contract, reduced motion/lifecycle, 1~4 동물 hit target을 검증한다.
- 실제 환경: 390/1280 웹, iOS/Android Development Build에서 스크린리더·키보드·모션 감소 체크리스트를 수행한다.

## 완료 조건

- [ ] 모든 주요 화면에 접근 가능한 이름·상태·오류가 있다.
- [ ] 작은 화면과 키보드에서 핵심 조작이 가려지지 않는다.
- [ ] reduced motion과 background 정지가 전체 앱에 적용된다.
- [ ] 플랫폼별 실제 검증 여부가 구분 기록된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
