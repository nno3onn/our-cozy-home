# 실제 환경 E2E 검증 Runbook

전용 테스트 계정만 사용하고 이메일·초대 토큰·사진·push token·secret은 기록에서 마스킹한다.

## 사전 조건

- staging/production Supabase에 모든 migration과 seed 적용
- `send-push`, `delete-account`, `reconcile-account-deletion` Edge Function 배포
- Vercel production URL과 Supabase Auth Redirect URLs 설정
- A/B/C/D/E 테스트 계정과 iOS·Android Development Build 준비

## 기록 매트릭스

| ID | 환경 | 절차 | 기대 결과 | 결과 |
| --- | --- | --- | --- | --- |
| E2E-01 | Supabase A/B | A 생성→초대→B 입주 | 양쪽 2/4, B만 입주 | 미수행 |
| E2E-02 | Supabase A/B | 각자 기여 | 두 번째 기여에서 가구 1개 | 미수행 |
| E2E-03 | Supabase A/B | B 탈퇴→A 추가→원본 삭제 | cutoff·삭제 전파 준수 | 미수행 |
| E2E-04 | Supabase A–E | 3명 순차 입주·5번째 수락 | 4/4, 다섯 번째 차단 | 미수행 |
| E2E-05 | Supabase | admin 탈퇴 | 가장 이른 가입자 승계 | 미수행 |
| E2E-06 | production web | `/invite/:token`, `/memories/:id` 직접 접근/새로고침 | SPA 복구·권한 재검증 | 미수행 |
| E2E-07 | iOS/Android | 초대, 푸시 권한/수신/선택, 종료 뒤 재실행 | 현재 권한 route로 이동 | 미수행 |
| E2E-08 | web/mobile | 네트워크 단절 중 구매/입주 | 읽기 전용·결과 조정 | 미수행 |

자동화 결과는 실제 Supabase, production web, iOS/Android 결과를 대체하지 않는다.
