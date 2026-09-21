# [E2E Verification] 실제 Supabase 다계정과 프로덕션 웹 Smoke 검증

## 목적

배포 가능한 첫 버전을 실제 Supabase 계정·프로덕션 웹·Development Build에서 연결된 사용자 흐름으로 검증하고 증거를 남긴다.

## 배경 / 현재 상태

데모 웹과 자동화 테스트 결과는 있으나 실제 Supabase 계정, 프로덕션 URL, iOS/Android 기기 검증은 없다.

## 선행 작업

026-notification-outbox-and-delivery.md, 028-web-deep-links-and-production-hosting.md, 029-responsive-accessibility-and-reduced-motion.md, 030-database-concurrency-and-security-suite.md

## 구현 범위

- staging/production형 Supabase에 migration/seed/Edge Function을 적용하는 검증 runbook을 실행한다.
- 실제 계정 A/B 및 추가 계정으로 핵심 입주→추억→탈퇴 시나리오를 수행한다.
- production 웹 route/deep link/offline 복구 smoke와 Development Build 기기 체크를 기록한다.
- 발견된 결함은 범위에 맞는 후속 Issue로 분리하고 `docs/progress.md` 검증 원장을 갱신한다.

## 상세 요구사항

- A 초대→B 입주→두 기여→같은 가구→B 탈퇴→접근 차단을 끝까지 확인한다.
- B 보관함 cutoff, A의 퇴장 후 추가 내용 차단, A 원본 삭제 전파를 확인한다.
- 한 초대 세 명 순차 입주와 다섯 번째 차단, 집장 승계를 확인한다.
- production 웹 직접 URL/새로고침, 실제 이미지, Realtime을 smoke한다.
- 실제 기기에서 초대 link, 알림 권한/수신/선택, 앱 종료 후 재실행을 확인한다.
- 자동화/웹/실기기 결과를 서로 대체하지 않는다.

## 보안 / 권한

검증 로그·스크린샷에서 이메일, 초대 token, 사진 원본, push token과 secret을 마스킹한다. production 사용자 데이터 대신 전용 테스트 계정을 쓴다.

## 동시성 / 멱등성

동시성의 자동 증명은 030을 기준으로 하되 실제 UI 중복 터치와 네트워크 응답 단절 조정도 smoke한다.

## 제외 범위

실제 유료 결제, 관리자 강제 퇴장, 최종 에셋 제작은 제외한다.

## 테스트

- 자동화: typecheck, lint, Jest, web export, DB release suite를 최종 gate로 재실행한다.
- 실제 환경: 실제 Supabase, production web, iOS/Android Development Build 결과를 플랫폼별 체크리스트와 날짜로 기록한다.

## 완료 조건

- [ ] A/B 핵심 사용자 흐름이 실제 Supabase에서 통과한다.
- [ ] production 웹의 주요 route와 deep link smoke가 통과한다.
- [ ] iOS/Android 실제 검증 결과 또는 미수행 사유가 각각 기록된다.
- [ ] 자동화·목업·실제 검증 상태가 문서에서 명확히 구분된다.
- [ ] 발견된 미완료 항목이 후속 Issue로 추적된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
