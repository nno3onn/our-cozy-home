# 우리집

친구 최대 4명이 한 집에서 각자의 동물을 키우고, 공동 방을 꾸미며, 함께한 추억을
가구로 남기는 Expo 기반 웹·모바일 앱이다. 웹은 데스크톱과 모바일 폭에 대응하는
정식 실행 대상이며, iOS·Android도 같은 코드베이스에서 유지한다. 현재 저장소는
**명시적 데모 모드의 실행 가능한 경험**과 Supabase 이메일 세션·프로필·집·초대·경제·
방 배치·추억·버릇을 위한 클라이언트, PostgreSQL migration/RPC/RLS 코드를 포함한다.
로컬 PostgreSQL release gate는 GitHub Actions에서 검증한다. 다만 원격 Supabase에
전체 migration을 적용하고 실제 다계정·실기기에서 검증하는 일은 별도의 외부 환경
작업으로 남아 있으므로, 전체 실서비스 연동 완료로 간주하면 안 된다.

제품 규칙은 [`docs/product-spec.md`](docs/product-spec.md), 기술 책임은
[`docs/architecture.md`](docs/architecture.md), 현재 구현 범위는
[`docs/progress.md`](docs/progress.md)를 기준으로 한다.

## 요구 환경

- Node.js 20.19.4 이상(권장: 최신 LTS)
- npm
- iOS 확인: macOS, Xcode, CocoaPods
- Android 확인: Android Studio와 SDK
- 실제 서버 모드: 별도 Supabase 프로젝트
- EAS 원격 빌드: Expo 계정과 `eas login`

## 설치와 데모 실행

```bash
npm install
cp .env.example .env
npm run start
```

`.env`의 `EXPO_PUBLIC_APP_MODE=demo`를 유지한다. 웹 개발 서버는 `npm run web`,
iOS Simulator는 `npm run ios`, Android Emulator는 `npm run android`로 연다.
앱 화면 상단의 `DEMO` 표시가 데모 데이터 사용 여부를 알린다.

현재 데모에서 확인할 수 있는 흐름:

- 4명과 동물 4마리의 방, 중복 동물 종류와 사용자별 이름·포인트 색상
- 동물 터치 후 먹기·쉬기·놀기 반응
- 두 사용자가 소유한 쿠션의 고정 슬롯 교체와 배치 버전 증가
- 방의 추억 라디오 또는 추억 탭에서 상세 열기
- 설정에서 55종 임시 에셋 목록 확인과 데모 상태 초기화

Supabase 모드에서 웹 연결이 끊기면 마지막으로 성공한 방·상점·꾸미기 화면은
`오프라인 읽기 전용`으로 남고, 입주·출석·구매·배치 같은 확정 명령은 실행되지 않는다.
연결 또는 앱 foreground 복귀 뒤에는 집 소속과 snapshot을 다시 확인한다. 이 동작의
실제 browser 네트워크 토글 및 네이티브 reachability 검증은 아직 기록되지 않았다.

## 품질 명령

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
EXPO_PUBLIC_APP_MODE=demo npx expo export --platform web
```

## 웹 프로덕션 빌드

```bash
npm run build:web
npm run verify:web:export
npm run preview:web
```

정적 결과는 `dist/`에 생성된다. Expo Router가 `/`, `/decorate`, `/memories`,
`/settings`, `/dev/assets`, `/invite/:token`, `/memories/:id`를 관리한다. Vercel은
저장소의 `vercel.json` rewrite로 직접 접근·새로고침을 `index.html`로 복구한다.
`npm run verify:web:export`는 생성물 전체에 service-role/worker secret 이름이 없는지와
rewrite 계약을 확인한다.

Vercel 프로젝트의 Build Command는 `npm run build:web`, Output Directory는 `dist`로
설정한다. Supabase Dashboard의 **Auth → URL Configuration**에는 production 도메인과
preview 도메인(예: `https://our-cozy-home.vercel.app`, `https://*.vercel.app`)을 Redirect
URLs로 추가한다. 앱에는 `EXPO_PUBLIC_SUPABASE_URL`과 publishable key만 설정하며,
service-role·worker secret은 Vercel 환경 변수에도 넣지 않는다. production URL에서
초대/추억 상세 주소를 직접 열고 새로고침하는 검증은 아직 수행하지 않았다.

## Development Build와 EAS

네이티브 모듈·딥 링크·알림을 확인할 때 Expo Go가 아니라 Development Build를
사용한다.

```bash
npx expo run:ios
npx expo run:android
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

로컬 네이티브 명령에는 Xcode 또는 Android SDK가 필요하고, EAS 명령에는 Expo
계정과 각 플랫폼 서명 설정이 필요하다. 아직 실제 기기에서 알림·딥 링크·앱 재실행을
검증하지 않았다.

## Supabase 로컬 개발 환경

Supabase CLI는 `npm install`로 개발 의존성에 함께 설치된다. Node.js 20.19.4 이상이
필요하며, 저장소의 `.nvmrc`는 검증에 사용한 Node.js 22.14.0을 지정한다. 로컬 실행에는
Docker Desktop 또는 호환 Docker daemon이 필요하다. 앱 시작, 웹 빌드와 테스트는 DB를
자동으로 시작·초기화·삭제하지 않는다.

`nvm`을 사용한다면 먼저 `nvm use`를 실행한다. 시스템 기본 Node가 낮으면 Expo의 환경
변수 파서가 실패할 수 있다.

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:db:reset
npm run supabase:test
```

`supabase:db:reset`은 명시적으로 실행할 때만 모든 로컬 migration과
`supabase/seed.sql`을 다시 적용한다. 공통 집 정원 `4`, 한국 날짜 출석 보상 `100`,
40종 상점·15종 추억 가구와 고정 방 슬롯을 반복 가능하게 넣는다. 카탈로그를 바꾼 뒤에는
`npm run catalog:seed`로 `supabase/seed/001_item_definitions.sql`을 재생성하고 drift
테스트를 실행한다.

`npm run supabase:status`가 보여주는 local API URL과 publishable key를 `.env`의
아래 값에 복사한 뒤 `EXPO_PUBLIC_APP_MODE=supabase`로 변경한다. 이메일 로그인 후
프로필·동물 온보딩을 사용하려면 `20260921000200_profile_animal_onboarding.sql`까지
적용되어 있어야 한다. 이어서 혼자 집을 만들려면
`20260921000300_house_creation.sql`까지 순서대로 적용한다. 이 RPC는 활성 집이 없는
인증 사용자에게만 집과 최초 admin 멤버십을 원자적으로 만든다.

```dotenv
EXPO_PUBLIC_APP_MODE=supabase
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=LOCAL_PUBLISHABLE_KEY_FROM_STATUS
```

Docker daemon을 찾지 못하면 Docker Desktop을 시작한 뒤 `npm run supabase:start`를
다시 실행한다. 이미 실행 중인 컨테이너와 포트가 충돌하면 `npm run supabase:status`로
확인한 뒤 필요한 경우에만 `npm run supabase:stop`을 실행한다.

실제 원격 프로젝트는 다음 값을 사용한다.

```dotenv
EXPO_PUBLIC_APP_MODE=supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Docker를 사용하지 않는 경우에도 원격 프로젝트로 개발을 진행할 수 있다. Supabase
Dashboard의 **Connect** 또는 **Project Settings → API Keys**에서 Project URL과
publishable key를 확인해 위 값에 넣는다. 이 저장소의 원격 프로젝트는 서울 리전에
생성되어 있으며, 프로젝트 ref는 `cbyikdryogktctskvzzk`이다. 키는 저장소에 커밋하지
않는다. 원격 연결은 로컬 `supabase start/reset/test`의 대체 검증이 아니므로, 실제로
검증한 범위는 `docs/progress.md`에 구분해 기록한다.

publishable key만 앱에 둘 수 있다. service role key, 알림 공급자 자격 증명 및 기타
서버 비밀은 앱 번들에 넣지 않는다. 생성 타입은 현재 원격 프로젝트의 CLI 인증으로 다음
명령을 실행해 갱신한다.

```bash
npm run supabase:types
```

Docker local DB가 실행 중인 경우에는 `npm run supabase:types:local`을 사용한다.
원격 migration을 CLI로 적용하려면 별도의 DB 비밀번호로 프로젝트를 link해야 하며, 그
비밀번호를 `.env`나 저장소에 넣지 않는다. 현재 기반 스키마는 DB 비밀번호가 없는 환경에서
Dashboard SQL Editor로 적용됐으므로, 자동 배포를 시작하기 전에 `supabase link`와 migration
history 정합을 한 번 확인해야 한다.

### 수동 원격 migration 배포

로컬 네트워크가 원격 DB의 직접 연결을 지원하지 않을 때는 GitHub Actions의 **Apply remote
Supabase migrations**를 수동으로 실행할 수 있다. 이 workflow는 push·PR에 연결되지 않으며,
고정된 `cbyikdryogktctskvzzk` 프로젝트에만 적용된다. 실행 전 저장소 관리자만 아래
repository secret을 설정한다.

- `SUPABASE_ACCESS_TOKEN`: database write 권한이 있는 Supabase personal access token
- `SUPABASE_DB_PASSWORD`: 해당 프로젝트의 database password

Actions 화면에서 workflow를 선택하고 확인값으로 정확히 `APPLY-MIGRATIONS`를 입력한다.
workflow는 secret을 출력하지 않고 `supabase db push` 뒤 `--dry-run`으로 남은 migration이
없는지만 확인한다. seed, Edge Function, 앱 타입 파일은 변경하거나 배포하지 않는다.
실행 전에는 PR의 Database release gate가 통과했는지 확인하고, 실행 뒤에는 원격 migration
history와 실제 다계정 E2E 결과를 별도로 기록한다. workflow 계약은 로컬에서 다음 명령으로
점검한다.

```bash
npm run supabase:verify-remote-release
```

모든 schema 변경은 `supabase/migrations`에 새 파일로 추가하며 적용한 migration을
수정하지 않는다. `npm run supabase:check`는 local Docker 없이 파일 구조와 명령 계약을
검사한다.

## Push Outbox 배포

`20260921002000_notification_outbox.sql`은 입주·추억 가구 완성·버릇 습득을 멱등
outbox event로 기록한다. `supabase/functions/send-push`는 대기 target을 Expo Push
Service에 배치 발송하고 ticket/receipt, 재시도 및 무효 token을 처리한다. 이 Function은
앱에서 직접 호출하지 않는다. scheduler 요청을 받기 위해 JWT 검증은 끄되,
`NOTIFICATION_WORKER_SECRET` 검증 없이는 worker를 실행하지 않는다.

원격 migration 적용 뒤 프로젝트 관리자만 다음처럼 Edge Function secret을 설정하고
배포한다. `NOTIFICATION_WORKER_SECRET`과 service-role key를 앱의 `.env`나 Git에
넣지 않는다. Expo의 APNs/FCM 자격 증명은 Expo/EAS 프로젝트 설정에서 별도로
완성해야 한다.

```bash
npx supabase secrets set --project-ref cbyikdryogktctskvzzk \
  NOTIFICATION_WORKER_SECRET='long-random-secret'
npx supabase functions deploy send-push --project-ref cbyikdryogktctskvzzk
```

외부 scheduler(예: 신뢰할 수 있는 cron 서비스)는 1분 간격으로 아래 endpoint를
호출한다. secret을 브라우저, 앱 또는 공개 CI 로그에 넣지 않는다.

```bash
curl --fail-with-body \
  -H "x-notification-worker-secret: $NOTIFICATION_WORKER_SECRET" \
  "https://cbyikdryogktctskvzzk.functions.supabase.co/send-push"
```

로컬 Docker가 실행 중이면 migration과 pgTAP test를 적용해 worker RPC를 검증한다.
Edge Function은 Deno runtime용이므로 앱의 `npm run typecheck` 범위에서 제외되고,
배포 전 `supabase functions serve send-push` 또는 deploy 환경에서 별도로 확인한다.

## 계정 삭제 Edge Function

`20260928000200_account_deletion.sql`은 사용자가 먼저 개인 데이터 정리와 집 퇴장을
멱등 요청으로 준비하고, `delete-account` Function이 검증된 현재 사용자만 Auth에서
최종 삭제하게 한다. Function은 service-role key를 Supabase 관리 환경에서만 사용하며
앱에는 포함하지 않는다. Auth 삭제 뒤 공동 결과의 외래 키를 깨지 않도록 프로필과 동물은
`떠난 친구`·`떠난 동물`로 비식별화된 tombstone으로 남는다.

원격 migration을 적용한 뒤 프로젝트 관리자가 Function을 배포한다.

```bash
npx supabase secrets set --project-ref cbyikdryogktctskvzzk \
  ACCOUNT_DELETION_WORKER_SECRET='long-random-secret'
npx supabase functions deploy delete-account --project-ref cbyikdryogktctskvzzk
npx supabase functions deploy reconcile-account-deletion --project-ref cbyikdryogktctskvzzk
```

배포 전에는 별도 테스트 계정으로 설정 → 계정 삭제 확인을 실행하고, 집 퇴장·사진
Storage 제거·재로그인 불가·공동 추억 보존을 함께 확인해야 한다. 현재 저장소에서는
Function deploy와 실제 Auth 삭제를 검증하지 않았다.

Auth 삭제 뒤 완료 상태 기록이 일시적으로 실패한 요청은 운영자만 아래 worker로
재조정한다. 이 secret과 profile ID를 앱·브라우저 로그에 노출하지 않는다.

```bash
curl --fail-with-body -X POST \
  -H "x-account-deletion-worker-secret: $ACCOUNT_DELETION_WORKER_SECRET" \
  -H "content-type: application/json" \
  -d '{"profileId":"ACCOUNT_DELETION_PROFILE_ID"}' \
  "https://cbyikdryogktctskvzzk.functions.supabase.co/reconcile-account-deletion"
```

## 에셋 상태

상점 40종과 추억 가구 15종의 카탈로그·크기·기준점·슬롯·상호작용 데이터와 DB seed는
있다. 실제 Supabase에 migration·seed를 적용하기 전에는 실제 계정 상점이 동작하지 않는다.
현재는 햇살 방·토끼·고양이·곰·강아지·쿠션/탁자/고무나무/달잠 침대/반딧불 스탠드의 파일럿 일러스트만 완성 파일로 연결되어
있고, 나머지 상품은 코드 placeholder다. 데모에서 설정 → `55종 임시 에셋 보기`로
완성 일러스트와 제작 중 항목을 한 번에 확인할 수 있다.
