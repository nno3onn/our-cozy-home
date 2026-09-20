# [Notification] 권한 기반 알림 Outbox와 Expo Push 발송 구현

## 목적

성공한 도메인 사건을 중복 없이 수신자별 delivery로 만들고 발송 직전 권한을 확인해 Expo Push Service로 전달한다.

## 배경 / 현재 상태

입주·추억 완성·버릇 획득 사건은 DB에서 발생할 수 있지만 outbox, Edge Function, 재시도와 receipt 처리가 없다.

## 선행 작업

008-invite-acceptance-concurrency.md, 019-memory-completion-and-furniture.md, 022-habit-learning-transactions.md, 025-push-token-and-notification-routing.md

## 구현 범위

- `notification_events`, `notification_deliveries` schema와 event dedupe key를 추가한다.
- 도메인 RPC 성공 트랜잭션에 outbox event 생성을 연결한다.
- Supabase Edge Function으로 batching, Expo Push 발송, retry/backoff, receipt 확인, invalid token 비활성화를 구현한다.
- 배포/비밀/스케줄 또는 queue 실행 절차를 문서화한다.

## 상세 요구사항

- 입주: 입주자 본인을 제외한 현재 멤버.
- 추억 가구 완성: 현재 멤버이면서 해당 memory viewer인 사람.
- 버릇 습득: learner와 teacher 소유자, 행위자 본인 중복 제외.
- 발송 직전에 현재 소속·viewer·알림 설정·토큰 유효성을 다시 확인한다.
- 탈퇴자와 권한 없는 후입주자에게 보내지 않는다.
- 본문에 비공개 글·사진·경로를 넣지 않는다.
- 같은 추억 연속 기여 push는 사건 키/시간 창으로 묶거나 제한한다.

## 보안 / 권한

Edge Function의 service role과 Expo 자격 증명은 서버 secret으로만 제공한다. 호출 권한과 payload를 최소화한다.

## 동시성 / 멱등성

event/delivery 고유 키, 상태 전이와 lease로 중복 worker 발송을 막는다. 재시도 가능/영구 실패를 구분한다.

## 제외 범위

마케팅 알림, 사용자 간 자유 메시지, 푸시를 상태 저장 수단으로 쓰는 기능은 제외한다.

## 테스트

- 자동화: 수신자 행렬, 행위자 제외, 권한 변화 직전 차단, event/delivery 중복, retry/receipt/invalid token을 mock으로 검증한다.
- 실제 환경: 배포된 Edge Function과 실제 기기에서 세 알림 유형을 확인한다.

## 완료 조건

- [ ] 세 도메인 사건이 성공 후 outbox에 한 번 기록된다.
- [ ] 수신자와 권한이 발송 직전에 재검증된다.
- [ ] 재시도·중복 방지·무효 토큰 정리가 동작한다.
- [ ] 알림 본문이 비공개 내용을 포함하지 않는다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
