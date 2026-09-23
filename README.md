# 우리집

친구 최대 4명이 한 집에서 각자의 동물을 키우고, 공동 방을 꾸미며, 함께한 추억을
가구로 남기는 Expo 기반 웹·모바일 앱이다. 웹은 데스크톱과 모바일 폭에 대응하는
정식 실행 대상이며, iOS·Android도 같은 코드베이스에서 유지한다. 현재 저장소는
**명시적 데모 모드의 실행 가능한 기반**과 Supabase 이메일 세션·프로필/동물
온보딩 코드를 포함한다. 집·초대·경제·추억·버릇의 실제 서버 기능은 아직 단계별로
구현 중이므로 전체 연동 완료로 간주하면 안 된다.

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
npm run preview:web
```

정적 결과는 `dist/`에 생성된다. Expo Router가 `/`, `/decorate`, `/memories`,
`/settings`, `/dev/assets`와 추억 상세 경로를 관리한다. 실제 호스팅에서는 동적 추억
상세 URL이 앱으로 돌아오도록 플랫폼의 SPA/라우트 rewrite를 설정해야 한다.

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

모든 schema 변경은 `supabase/migrations`에 새 파일로 추가하며 적용한 migration을
수정하지 않는다. `npm run supabase:check`는 local Docker 없이 파일 구조와 명령 계약을
검사한다.

## 에셋 상태

상점 40종과 추억 가구 15종의 카탈로그·크기·기준점·슬롯·상호작용 데이터와 DB seed는
있다. 실제 Supabase에 migration·seed를 적용하기 전에는 실제 계정 상점이 동작하지 않는다.
현재 시각물은 모두 코드로 그린 `placeholder`이며 최종 제작 에셋이 아니다. 데모에서
설정 → `55종 임시 에셋 보기`로 한 번에 확인할 수 있다.
