# 실제 환경 E2E 검증 Runbook

전용 테스트 계정만 사용하고 이메일·초대 토큰·사진·push token·secret은 기록에서 마스킹한다.

## 사전 조건

- staging/production Supabase에 모든 migration과 seed 적용
- `send-push`, `delete-account`, `reconcile-account-deletion` Edge Function 배포
- Vercel production URL과 Supabase Auth Redirect URLs 설정
- iOS·Android Development Build 준비

## 환경 준비 현황

- 2026-10-06: production migration history와 생성 Database 타입 일치 확인
- 2026-10-06: `send-push`, `delete-account`, `reconcile-account-deletion` 배포 및 `ACTIVE` 확인
- 2026-10-06: 세 함수의 인증 없는 요청이 모두 HTTP 401로 거부되는지 확인
- 2026-10-06: 임시 A–E 계정을 자동 생성해 집 흐름을 네 번 실행하고 매 실행 후 Auth와
  집 데이터를 정확한 ID로 정리함
- 미완료: worker scheduler, Expo APNs/FCM 자격 증명, 실제 기기

## 기록 매트릭스

| ID | 환경 | 절차 | 기대 결과 | 결과 |
| --- | --- | --- | --- | --- |
| E2E-01 | Supabase A/B | A 생성→초대→B 입주 | 양쪽 2/4, B만 입주 | RPC 성공·membership 확인(화면 미확인) |
| E2E-02 | Supabase A/B | 각자 기여 | 두 번째 기여에서 가구 1개 | 미수행 |
| E2E-03 | Supabase A/B | B 탈퇴→A 추가→원본 삭제 | cutoff·삭제 전파 준수 | 미수행 |
| E2E-04 | Supabase A–E | 3명 순차 입주·5번째 수락 | 4/4, 다섯 번째 차단 | 통과: 동일 token 3회 입주, `house_full`, active 4명 |
| E2E-05 | Supabase | admin 탈퇴 | 가장 이른 가입자 승계 | 통과: B 승계, 1명 남을 때 active, 마지막 퇴장 후 archived |
| E2E-06 | production web | `/invite/:token`, `/memories/:id` 직접 접근/새로고침 | SPA 복구·권한 재검증 | 미수행 |
| E2E-07 | iOS/Android | 초대, 푸시 권한/수신/선택, 종료 뒤 재실행 | 현재 권한 route로 이동 | 미수행 |
| E2E-08 | web/mobile | 네트워크 단절 중 구매/입주 | 읽기 전용·결과 조정 | 미수행 |

자동화 결과는 실제 Supabase, production web, iOS/Android 결과를 대체하지 않는다.

## 자동 러너

`npm run supabase:e2e:house`는 secret을 로그에 남기지 않고 다음을 실제 원격 RPC로 수행한다.

1. 이메일 확인이 완료된 임시 Auth 사용자 5명 생성 및 온보딩
2. A의 집 생성과 활성 초대 1개 생성
3. B/C/D가 같은 초대로 순차 입주
4. E 수락의 `house_full` 오류와 active membership 4개 확인
5. A 퇴장 시 B 집장 승계, B/C 퇴장 때 집 유지, D 퇴장 때 archive 확인
6. notification·초대 이력·membership·house·Auth 사용자를 FK 안전 순서로 삭제하고
   house/Auth ID가 남지 않았는지 재확인

2026-10-06 실제 실행은 네 번 모두 `scenario-passed`, `cleanup-finished`로 끝났다. 마지막
실행은 Node 22.14.0에서 수행했다. 시스템 Node 18에서도 `ws` transport를 명시해 동작을
검증했지만, 저장소의 정식 요구 환경은 Node 20.19.4 이상이며 최신 Supabase SDK를 위해
Node 22 사용을 권장한다.
