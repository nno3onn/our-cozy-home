# 우리집 구현·검증 현황

최종 수정일: 2026-09-20

기능을 완료할 때 코드 경로, 검증 명령과 결과를 함께 갱신한다. 자동화 검증,
로컬 Supabase 검증, 실제 계정·실기기 검증은 서로 대체하지 않는다.

## 기준 문서

- 제품 요구사항: [`product-spec.md`](product-spec.md)
- 기술 책임: [`architecture.md`](architecture.md)
- 기본값 결정: [`decisions.md`](decisions.md)
- 상세 기술 설계:
  [`superpowers/specs/2026-09-19-woorijip-design.md`](superpowers/specs/2026-09-19-woorijip-design.md)

문서가 충돌하면 구현을 멈추고 제품 명세와 기술 문서를 함께 고친다.

## 현재 상태

- 완료: 제품 명세·기술 설계, Expo 프로젝트, 명시적 데모 repository, 4인 방,
  동물 터치 행동, 고정 슬롯 가구 교체, 추억 목록·상세, 데모 초기화
- 완료: 상점 8개 카테고리 × 5종과 추억 가구 3개 종류 × 5외형의 데이터 카탈로그
- 완료: Supabase CLI 고정, 로컬 `config.toml`, 추가 전용 migration·seed·SQL test
  디렉터리와 명시적 실행 명령 기반
- 완료: 서울 리전 원격 Supabase 프로젝트(`our-cozy-home`) 생성, publishable key의
  로컬 `.env` 설정(비추적), Auth health 및 publishable-key Data API 요청 확인
- 완료: 핵심 `app_settings`·프로필·집·멤버십·동물 schema, 활성 멤버십 부분 고유 인덱스,
  기본 RLS와 실제 원격 생성 Database 타입
- 앱 코드: Expo SDK 57 기반 데모가 실행 가능
- Supabase 도메인 스키마·함수·정책: 미구현(로컬 CLI 기반만 완료)
- 데모 모드: 구현됨(메모리 기반이며 앱 재실행 시 초기화)
- 자동화 테스트: 카탈로그·repository·배치·UI 흐름 43개 통과(아래 검증 원장 참고)
- 실제 Supabase 계정 검증: 미수행
- 실제 iOS·Android 기기 검증: 미수행

## 구현 단계

| 단계 | 연결된 기능 범위 | 구현 | 자동화 검증 | 실제 환경 검증 |
| --- | --- | --- | --- | --- |
| 1 | Expo 초기화, 디자인 토큰, 데모 데이터, 방 | 완료 | 통과 | 웹 1280px·390px 확인 |
| 2 | 동물 터치, 기본 애니메이션, 파일럿 에셋 | 터치 반응 완료, 본체 애니메이션 일부 | 통과 | 실기기 미수행 |
| 2.5 | Supabase CLI·migration/test 기반 | 완료 | 정적 검사·타입·lint·Jest 통과 | 원격 health·publishable key 확인, Docker local start/reset/test는 미수행 |
| 2.6 | 핵심 DB schema·생성 타입 | 완료 | 타입 경계·SQL test 파일 추가 | 원격 SQL Editor schema query와 활성 소속 제약 transaction 확인, Docker pgTAP 실행은 미수행 |
| 3 | 로그인, 집 생성, 초대·입장·퇴장·승계 | 시작 전 | 시작 전 | 미수행 |
| 4 | 출석, 구매, 인벤토리, 공동 배치 | 데모 배치만 완료 | 배치 버전 통과 | 서버 미수행 |
| 5 | 추억 작성, 접근 범위, 추억 가구 | 데모 열람만 완료 | 목록·상세 통과 | 서버 권한 미수행 |
| 6 | 버릇 학습과 동물 행동 | 데모 데이터만 존재 | repository 복제 검증 | 화면·서버 미구현 |
| 7 | Realtime, 알림, 전체 권한·기기 확인 | 시작 전 | 시작 전 | 미수행 |

## 검증 원장

| 날짜 | 대상 | 명령 또는 환경 | 결과 | 범위 제한 |
| --- | --- | --- | --- | --- |
| 2026-09-19 | 명세 문서 | `git diff --check` | 통과 | 코드 동작을 검증하지 않음 |
| 2026-09-19 | 명세 문서 | 미결정 표식 검색 | 통과 | 요구사항 완전성을 자동 증명하지 않음 |
| 2026-09-20 | 데모 방·생명주기 | `npm test -- src/features/room --runInBand` | 통과 | Skia는 Jest 모형, 실제 GPU 렌더 아님 |
| 2026-09-20 | 55종 카탈로그·갤러리 | `npm test -- src/catalog src/features/dev --runInBand` | 통과 | 모두 임시 에셋 |
| 2026-09-20 | 꾸미기·추억·설정 | 기능별 Jest 테스트 | 통과 | 메모리 repository만 검증 |
| 2026-09-20 | 타입·정적 분석 | `npm run typecheck && npm run lint` | 통과 | 런타임 권한 검증 아님 |
| 2026-09-20 | Expo 웹 번들 | `EXPO_PUBLIC_APP_MODE=demo npm run build:web` | 통과 | iOS·Android 빌드 결과가 아님 |
| 2026-09-20 | 웹 화면·흐름 | 로컬 웹, 1280px·390px 폭 | 방·가구 교체·추억 상세 통과 | 브라우저 수동 검증이며 실기기 아님 |
| 2026-09-20 | Supabase foundation 파일·명령 | `npm run supabase:check` | 통과 | Docker 없이 구조·환경 변수·명령 계약만 검증 |
| 2026-09-20 | Supabase CLI 설정 파싱 | `npm run supabase:status` | Docker daemon 연결 단계까지 진행 | Docker가 설치·실행되지 않아 local status/start/reset/test 미수행 |
| 2026-09-21 | 원격 Supabase 프로젝트 | CLI 프로젝트 목록 | 서울 리전 프로젝트 생성 확인 | publishable key 설정 및 앱·DB 연결 검증은 대시보드 로그인 후 필요 |
| 2026-09-21 | 원격 Supabase 연결 | Dashboard API Keys, `/auth/v1/health`, Data API 미존재 테이블 요청 | Auth health 200, publishable key로 Data API가 `PGRST205` 404 응답 | 도메인 schema는 다음 Issue에서 추가 |
| 2026-09-21 | Node 런타임·정적 검사 | Node 22.14.0, `npm run lint && npm run typecheck` | 통과 | 기본 셸 Node 19.6.0에서는 Expo lint가 지원되지 않음 |
| 2026-09-21 | 회귀·웹 번들 | Node 22.14.0, `npm test -- --runInBand`, Supabase 환경 `npm run build:web` | 15 suites·43 tests 통과, 웹 export 통과 | Supabase repository는 다음 Issue 전까지 의도적으로 unavailable 화면 |
| 2026-09-21 | 핵심 schema | 원격 SQL Editor | 5개 테이블, `house_capacity=4`, `attendance_daily_reward=100`, RLS와 활성 멤버십 index 확인 | DB 비밀번호 부재로 CLI migration history 기록·Docker pgTAP는 미수행 |
| 2026-09-21 | 활성 집 하나 제약 | 원격 SQL Editor rollback transaction | 같은 profile의 두 번째 활성 멤버십은 `unique_violation`, 첫 멤버십 퇴장 뒤 다른 집 입주는 허용됨 | transaction은 rollback했고 Docker pgTAP SQL 파일은 미실행 |
| 2026-09-21 | 생성 Database 타입 | `supabase gen types typescript --project-id cbyikdryogktctskvzzk` | 원격 schema 기반 `database.generated.ts` 생성 | project ref 변경 시 npm script 갱신 필요 |

## 실제 환경 완료 시나리오

실제 Supabase 프로젝트가 준비되면 최소 두 계정 A와 B로 다음 결과를 기록한다.

1. A의 집 생성과 B 초대
2. B 입주와 양쪽 방 구성원 갱신
3. 두 사람의 추억 기여와 동일한 가구 확인
4. B 탈퇴와 집 데이터 접근 차단
5. B 개인 보관함의 퇴장 시점 열람 범위 확인
6. 퇴장 뒤 A의 추가 내용이 B에게 보이지 않는지 확인
7. A의 원본 삭제가 B 보관함에도 반영되는지 확인

딥 링크, 알림 권한·수신, 앱 종료 뒤 재실행과 이미지 업로드는 Development
Build를 설치한 실제 기기에서 별도로 기록한다.

## 에셋 현황

- 동물: 종별 비율을 구분하는 코드 도형 placeholder, 본체 애니메이션·최종 제작 전
- 상점 아이템 40종: 카탈로그·렌더 메타데이터 완료, 모두 placeholder
- 추억 가구 15종: 카탈로그·렌더 메타데이터 완료, 모두 placeholder
- 개발용 에셋 목록 화면: `/dev/assets` 구현, 데모 모드에서만 내용 표시

placeholder를 방에서 확인한 것과 최종 에셋 확인을 별도로 기록한다.

## 다음 작업

1. Supabase client repository와 실제 생성 타입의 domain 경계를 연결한다.
2. Auth와 집 생성·활성 집 하나 제약을 먼저 연결한다.
3. 24시간 다중 사용 초대와 동시 마지막 자리 수락 RPC를 구현한다.
4. 탈퇴·집장 승계·가구 회수를 같은 잠금 순서와 트랜잭션으로 구현한다.
5. 이후 출석·구매, 추억 권한 스냅샷, 2인 완성, 쌍별 버릇 학습 순서로 연결한다.

아직 자동 검증하지 못한 핵심 규칙은 출석·구매 동시성, 활성 집 하나, 정원 초과,
탈퇴 후 RLS 차단, 추억 가구 멱등 생성, 같은 날짜 학습 중복 방지와 타 사용자 비공개
데이터 차단이다. PostgreSQL 마이그레이션과 원격 Supabase 환경이 추가된 뒤 검증한다.
