# [Web Production] 웹 딥 링크·SPA Rewrite와 프로덕션 배포 구성

## 목적

웹을 정식 실행 대상으로 배포하고 초대/알림/추억 상세 URL이 직접 접근·새로고침에서도 앱으로 복구되게 한다.

## 배경 / 현재 상태

웹 export와 반응형 데모는 동작하지만 호스팅 대상, SPA rewrite, 실제 Supabase callback/deep link와 production smoke 자동화가 없다.

## 선행 작업

008-invite-acceptance-concurrency.md, 025-push-token-and-notification-routing.md

## 구현 범위

- 선택한 정적 호스팅 플랫폼의 배포 설정과 SPA/fallback rewrite를 추가한다.
- 초대 token, Auth callback, 알림 사건, memory 상세 URL 계약을 Expo Router와 연결한다.
- production 환경 변수/도메인/CORS/Auth redirect 설정 절차를 문서화한다.
- preview/production 배포와 route smoke script를 제공한다.

## 상세 요구사항

- `/invite/...`, `/memories/...` 직접 접근과 새로고침이 404가 되지 않는다.
- 로그인 전 초대는 004의 pending flow로 이어지고 서버가 다시 검증한다.
- 권한 없는 링크는 민감 내용을 노출하지 않고 안전한 route로 이동한다.
- build artifact에 service role이나 server secret이 포함되지 않는다.

## 보안 / 권한

source map/환경 변수/정적 파일에서 비밀 노출을 검사한다. 링크 query를 로그/analytics에 원문으로 남기지 않는다.

## 동시성 / 멱등성

없음. 딥 링크에서 발생하는 명령은 기존 멱등 RPC를 사용한다.

## 제외 범위

도메인 구매, SEO 마케팅 페이지, 네이티브 universal/app link 검증은 제외한다.

## 테스트

- 자동화: export 후 주요 route 파일/rewrites, 직접 URL, Auth/초대 pending route, 비밀 문자열 검사를 수행한다.
- 실제 환경: production URL에서 desktop/mobile viewport로 주요 route와 새로고침을 smoke test한다.

## 완료 조건

- [ ] production 웹 배포 설정이 저장소에 있다.
- [ ] 모든 주요 딥 링크가 직접 접근/새로고침에서 복구된다.
- [ ] 환경 변수와 callback 설정이 문서화된다.
- [ ] 배포 URL smoke 결과가 progress에 기록된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
