# 우리집

친구 최대 4명이 한 집에서 각자의 동물을 키우고, 공동 방을 꾸미며, 함께한 추억을
가구로 남기는 Expo 기반 웹·모바일 앱이다. 웹은 데스크톱과 모바일 폭에 대응하는
정식 실행 대상이며, iOS·Android도 같은 코드베이스에서 유지한다. 현재 저장소는
**명시적 데모 모드의 실행 가능한 기반**까지 구현되어 있다. Supabase 모드는 환경
검증까지만 하며 서버 repository는 아직 연결하지 않았으므로 연동 완료로 간주하면
안 된다.

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

## Supabase 모드 준비

향후 실제 모드는 다음 값을 사용한다.

```dotenv
EXPO_PUBLIC_APP_MODE=supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

publishable key만 앱에 둘 수 있다. service role key, 알림 공급자 자격 증명 및 기타
서버 비밀은 앱 번들에 넣지 않는다. 현재 `supabase` 마이그레이션·RLS·RPC·Storage
정책과 실제 repository는 다음 구현 단계이므로 위 값을 넣어도 서버 기능이 활성화되지
않고 정직한 미구현 안내가 표시된다.

실제 연결 단계에서는 Supabase CLI로 새 프로젝트에 마이그레이션과 seed를 적용하고,
생성된 데이터베이스 타입을 `src/types/database.generated.ts`에 반영해야 한다. 구체적인
명령은 마이그레이션이 추가되는 단계에서 이 문서에 갱신한다.

## 에셋 상태

상점 40종과 추억 가구 15종의 카탈로그·크기·기준점·슬롯·상호작용 데이터는 있다.
현재 시각물은 모두 코드로 그린 `placeholder`이며 최종 제작 에셋이 아니다. 데모에서
설정 → `55종 임시 에셋 보기`로 한 번에 확인할 수 있다.
