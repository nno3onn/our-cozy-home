# [Notification] 알림 권한·Expo Push Token과 안전한 화면 이동 구현

## 목적

현재 로그인 사용자에게만 기기 토큰을 연결하고 알림 수신/선택 시 서버 권한 재검증 후 올바른 화면으로 이동한다.

## 배경 / 현재 상태

Expo Notifications 설정, `push_tokens`, 권한 UX와 notification route가 없다.

## 선행 작업

004-auth-session-and-route-guards.md, 021-live-memory-user-flows.md

## 구현 범위

- Expo Notifications 설치/설정과 development build 구성을 추가한다.
- `push_tokens` schema, 등록·갱신·비활성화 repository/RPC를 구현한다.
- 권한 요청, 거부 안내, foreground 수신과 notification response router를 연결한다.
- 사건 ID로 서버에서 현재 접근 경로를 해석하고 fallback route를 제공한다.

## 상세 요구사항

- 로그인/계정 전환 때 토큰 연결 사용자를 재확인하고 이전 연결을 해제한다.
- 알림을 눌렀지만 집에서 나왔거나 추억 권한이 없으면 현재 접근 가능한 탭과 설명으로 이동한다.
- 알림 payload의 집 ID/추억 ID만 믿지 않는다.
- 웹에서 지원 불가/제한된 동작을 명시하고 모바일 검증으로 오인하지 않는다.

## 보안 / 권한

토큰 전체 값을 로그에 남기지 않고 본인 토큰만 등록/해제한다. 앱 번들에 Expo/Supabase 서버 비밀을 넣지 않는다.

## 동시성 / 멱등성

동일 기기 토큰 재등록은 upsert하며 여러 계정에 활성 연결되지 않게 한다. listener는 중복 등록하지 않는다.

## 제외 범위

서버 발송 outbox와 Expo Push 호출은 026에서 구현한다.

## 테스트

- 자동화: 권한 허용/거부, token upsert/계정 전환, foreground 수신, 허용/거부 route fallback, listener cleanup을 검증한다.
- 실제 환경: Development Build 실제 기기에서 권한·토큰·앱 종료 후 알림 선택을 확인한다.

## 완료 조건

- [ ] 토큰이 현재 로그인 사용자와만 연결된다.
- [ ] 알림 선택 때 서버 권한을 재검사한다.
- [ ] 접근 불가 대상은 안전한 화면으로 fallback한다.
- [ ] 실제 기기 미검증 여부가 문서에 명확하다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
