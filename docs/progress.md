# 우리집 구현·검증 현황

최종 수정일: 2026-09-24

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
- 완료: typed Supabase client·세션 저장소·repository 주입·사용자/집 cache key 기반
- 완료: Supabase Auth 이메일 세션, 로그인/가입 화면, 로그아웃과 세션 기반 route guard
- 진행: 프로필·개인 동물 온보딩 RPC와 화면·route guard, 집 생성/초대 선택 진입과
  RLS migration을 추가했으나, 원격 DB 적용 및 실제 계정 검증 전
- 진행: 집 생성·최초 admin 멤버십·request-key 멱등성 migration과 화면을 추가했으나,
  원격 DB 적용 및 실제 동시 요청 검증 전
- 진행: 24시간 초대 lifecycle migration, 안전한 초대 미리보기 RPC, 집장 초대
  생성·재발급 화면과 로그인 후 초대 복귀를 추가했으나, 원격 DB 적용 및 실제
  링크·권한 검증 전
- 진행: 초대 수락 이력·요청 키·집 정원 잠금 RPC와 수락 화면을 추가했으나, 원격 DB
  적용 및 실제 동시 수락 검증 전
- 진행: 탈퇴·집장 승계·마지막 멤버 archive·활성 초대 취소 RPC와 확인 UI를 추가했으나,
  원격 DB 적용 및 실제 다계정 검증 전
- 진행: 활성 멤버 기반 RLS helper·공유 read 정책·직접 history 접근 차단을 추가했으나,
  local/remote SQL 권한 검증 전
- 진행: private `memory-photos` bucket과 기본 거부 Storage 기반을 추가했으나,
  local/remote Storage API 검증 및 추억 viewer grant 연결 전
- 진행: 추억 기여·revision·사진 메타데이터, 현재 집/개인 보관함 분리 조회와 탈퇴
  시점 cutoff RPC를 추가했으나, 원격 migration 적용 및 다계정 권한 검증 전
- 진행: 개인 wallet·거래 원장·KST 하루 100코인 출석 RPC와 홈 실행 UI를 추가했으나,
  local/remote DB 적용 및 동시 호출 검증 전
- 진행: 실제 Supabase repository를 온라인 가드로 감싸고, 방·꾸미기·상점·입주 화면의
  오프라인 읽기 전용 표시 및 마지막 snapshot 유지·foreground/reconnect refetch를
  추가했으나, 웹 네트워크 토글·로컬 Supabase 중단/복구의 실제 환경 검증 전
- 진행: DB outbox event/delivery/target, worker lease·receipt·재시도 Edge Function과
  private-content-free payload를 작성했으나, 원격 migration/Function 배포·scheduler와
  실제 기기 push 검증 전
- 앱 코드: Expo SDK 57 기반 데모가 실행 가능
- Supabase 도메인 스키마·함수·정책: 미구현(로컬 CLI 기반만 완료)
- 데모 모드: 구현됨(메모리 기반이며 앱 재실행 시 초기화)
- 자동화 테스트: 카탈로그·repository·배치·UI 흐름 100개 통과(아래 검증 원장 참고)
- 실제 Supabase 계정 검증: 미수행
- 실제 iOS·Android 기기 검증: 미수행

## 구현 단계

| 단계 | 연결된 기능 범위 | 구현 | 자동화 검증 | 실제 환경 검증 |
| --- | --- | --- | --- | --- |
| 1 | Expo 초기화, 디자인 토큰, 데모 데이터, 방 | 완료 | 통과 | 웹 1280px·390px 확인 |
| 2 | 동물 터치, 기본 애니메이션, 파일럿 에셋 | 터치 반응 완료, 본체 애니메이션 일부 | 통과 | 실기기 미수행 |
| 2.5 | Supabase CLI·migration/test 기반 | 완료 | 정적 검사·타입·lint·Jest 통과 | 원격 health·publishable key 확인, Docker local start/reset/test는 미수행 |
| 2.6 | 핵심 DB schema·생성 타입 | 완료 | 타입 경계·SQL test 파일 추가 | 원격 SQL Editor schema query와 활성 소속 제약 transaction 확인, Docker pgTAP 실행은 미수행 |
| 2.7 | Supabase client·repository 기반 | 완료 | 48 Jest tests·typecheck·lint 통과 | 실제 세션/계정 데이터 read는 다음 Auth Issue에서 검증 |
| 2.8 | Supabase Auth 세션·route guard | 완료 | 50 Jest tests·typecheck·lint·웹 export 통과 | 실제 계정 가입/로그인·네이티브 secure storage는 미수행 |
| 2.9 | 프로필·개인 동물 온보딩 | 코드·migration 작성 완료, 원격 적용 대기 | 입력·온보딩 상태·route guard Jest 통과 | DB 비밀번호 또는 Dashboard SQL 실행 권한이 없어 RPC·RLS 실제 검증 미수행 |
| 3.0 | 집 생성·최초 admin 멤버십 | `create_house` advisory lock/RPC·request key, 최초 admin membership, 집 생성 화면과 `1/4` 멤버 UI 작성 완료 | 집 이름·재시도 request key·repository RPC mapping·집 없음 UI Jest 통과 | DB 비밀번호 또는 Dashboard SQL 실행 권한이 없어 RPC·RLS·동시 요청 실제 검증 미수행 |
| 3.1 | 24시간 초대 생성·미리보기 | 활성 초대 생성·취소·재발급 RPC, 링크/code 최소 미리보기, 로그인 후 복귀와 관리자 취소 화면 작성 완료 | 생성·재발급·취소 UI, 안전한 preview mapping, 로그인 후 초대 복귀 Jest 통과 | DB 비밀번호 또는 Dashboard SQL 실행 권한이 없어 RPC·권한·만료·실제 링크 검증 미수행 |
| 3.2 | 초대 수락·정원·멱등성 | acceptance history/request key, 사용자→집 lock RPC와 수락 상태 UI 작성 완료 | request key·정원/만료/취소/무효 링크 안내·repository mapping Jest 통과 | Docker 부재로 SQL 동시성 test 미실행, 실제 다계정 수락 미검증 |
| 3.3 | 집 나가기·승계·archive | `leave_house` lock/RPC, 배치 회수 trigger, admin 승계/archive·초대 취소와 탈퇴 뒤 캐시 초기화·집 선택 이동 작성 완료 | 탈퇴 확인 UI·repository mapping Jest 통과 | Docker 부재로 `006_house_leave_and_succession_test.sql` 미실행, 실제 다계정 탈퇴·RLS 미검증 |
| 4.0 | RLS/RPC hardening | active membership helper, direct write revoke, RPC execute 제한과 전체 table 권한 매트릭스 작성 완료 | 정책 checklist·pgTAP 파일 추가 | local Supabase 부재로 다중 JWT RLS test 미실행 |
| 4.1 | 비공개 추억 Storage 기반 | private bucket, 무작위 photo key, uploader/viewer/archive cutoff RLS와 lifecycle 경계 문서화 완료 | private bucket·deny-by-default·정책 문서 추가 | local Supabase 부재로 Storage API 테스트 미실행; signed URL 실제 발급·viewer grant 다계정 검증은 후속 photo flow에서 필요 |
| 5.0 | wallet·출석 | 개인 wallet·ledger, KST 하루 100코인 RPC와 홈 UI 작성 완료 | RPC mapping·홈 출석 UI Jest, 첫 지급/동일 일자 재시도·원장 SQL 시나리오 작성 | local Supabase 부재로 KST·동시 출석 SQL test 미실행 |
| 5.1 | 서버 카탈로그 | `item_definitions`·`room_slots`, 55종 결정적 seed, 실제 repository 상점 조회·8개 필터 화면 작성 완료 | seed drift·repository mapping·상점 UI Jest 통과 | local/remote migration·seed와 실제 Supabase 상점 조회 미검증 |
| 5.2 | 구매·인벤토리 | 구매 요청·개인 소유 schema, 멱등 구매/결과 RPC, 상점 구매·보관함 화면 작성 완료 | demo 재시도·repository mapping·코인 부족 UI Jest 통과, 구매 SQL 시나리오 추가 | local/remote 동시 구매·RLS·새 세션 inventory 미검증 |
| 6.0 | 공동 방 배치 | placement schema·예상 버전 RPC·탈퇴 배치 회수·실제 snapshot 조회 작성 완료 | repository RPC mapping Jest·typecheck 통과 | local/remote 동시 이동·슬롯 점유·탈퇴 경쟁·RLS 미검증 |
| 6.1 | 실제 방 snapshot·오프라인 읽기 전용 | online repository 가드, 마지막 query snapshot 표시, 방·상점·꾸미기·입주 UI 명령 제한, foreground/reconnect refetch 작성 완료 | 연결 상태·가드·캐시 정리·오프라인 UI Jest 통과 | 브라우저 네트워크 토글, local Supabase 중단/복구, 네이티브 reachability 미검증 |
| 7.0 | 추억 초안·공유 대상 snapshot | private draft·명시적 share RPC, `memory_viewers` snapshot RLS, 작성 화면·공유 대상 표시 작성 완료 | repository mapping·작성 UI Jest 통과 | local/remote SQL RLS·다계정 공유 검증 미실행 |
| 7.1 | 기여 revision·탈퇴 보관함 | 기여 단일 행+revision, 사진 메타데이터, 직접 기여자 archive·cutoff 서버 조회와 원본 삭제 전파 작성 완료 | repository current/archive mapping·SQL pgTAP 시나리오 파일·Jest 통과 | Docker 부재로 pgTAP 미실행, 원격 migration·A/B 탈퇴 후 cutoff 미검증 |
| 7.2 | 두 명 기여·추억 가구 | memory row lock, 출처 고유 memory item·완료 event, 현재 viewer 기반 방 노출 정책과 snapshot item 조회 작성 완료 | 22개 pgTAP 시나리오 파일·typecheck 통과 | Docker 부재로 pgTAP 미실행, 원격 migration·동시 두 번째 기여·다계정 방 노출 미검증 |
| 9.1 | 알림 Outbox·Expo Push | event/delivery/token target, DB lease·권한 재검증·receipt/재시도와 `send-push` Edge Function 작성 완료 | payload·ticket 분류·backoff Jest 통과 | local DB/pgTAP, Edge deploy/scheduler, Expo 실제 기기 수신 미검증 |

## 검증 원장

| 날짜 | 대상 | 명령 또는 환경 | 결과 | 범위 제한 |
| --- | --- | --- | --- | --- |
| 2026-09-19 | 명세 문서 | `git diff --check` | 통과 | 코드 동작을 검증하지 않음 |
| 2026-09-24 | 서버 카탈로그·상점 조회 | `npm test -- --runInBand src/repositories/supabase/__tests__/SupabaseRepository.test.ts src/catalog/__tests__/catalog.test.ts src/features/shop/screens/__tests__/ShopScreen.test.tsx`, `npm run catalog:seed` | 3 suite/25 test 통과, 결정적 seed 재생성 | 실제 Supabase migration/seed·RLS 조회는 별도 환경이 필요함 |
| 2026-09-24 | 구매·인벤토리 | `npm test -- --runInBand --forceExit src/repositories/supabase/__tests__/SupabaseRepository.test.ts src/features/shop/screens/__tests__/ShopScreen.test.tsx` | repository 부족 금액 mapping·상점 부족 안내 22 test 통과 | `009_purchase_inventory_test.sql`은 작성했으나 Docker/local Supabase 부재로 미실행 |
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
| 2026-09-22 | 온보딩 클라이언트 규칙 | `npm test -- src/auth/__tests__/onboardingValidation.test.ts src/auth/__tests__/onboardingStatus.test.ts src/auth/__tests__/routeGuard.test.ts --runInBand` | 3 suites·8 tests 통과 | RPC·RLS가 아직 원격 DB에 적용되지 않아 실제 사용자 저장은 미검증 |
| 2026-09-22 | 집 생성 클라이언트 규칙 | House validation·screen·repository·home empty-state Jest | request key 재사용, 이미 집이 있는 사용자 안내, `1/4` 표시 기반 확인 | 실제 PostgreSQL advisory lock·RLS와 concurrent RPC는 미검증 |
| 2026-09-22 | 초대 클라이언트 흐름 | `InviteManagerScreen`, auth route guard Jest·`npm run lint`·`npm run typecheck` | 2개 초대 관리 UI 테스트와 로그인 후 미리보기 복귀를 확인 | `004_invite_lifecycle_test.sql`은 Docker 부재로 미실행, 실제 Supabase RPC·딥 링크는 미검증 |
| 2026-09-22 | 전체 회귀·웹 번들 | Node 22.14.0, `npm test -- --runInBand --forceExit`, `npm run lint`, `npm run typecheck`, `EXPO_PUBLIC_APP_MODE=demo npm run build:web` | 27 suites·77 tests 통과, lint·typecheck·웹 export 통과 | Jest는 `--forceExit`가 필요할 정도의 비동기 핸들 경고를 출력함; PostgreSQL SQL tests·실제 링크는 미검증 |
| 2026-09-22 | 초대 수락 클라이언트 규칙 | 수락 control·repository·홈 화면 Jest, `supabase test db` | 3 suites·14 tests 통과, 요청 키·정원 초과 오류·홈 cache 무효화 경로 확인 | `supabase test db`는 local Supabase가 실행 중이지 않아 `005_invite_acceptance_test.sql`을 실행하지 못함; 실제 PostgreSQL 동시 수락 미검증 |
| 2026-09-22 | 탈퇴 클라이언트 규칙 | `HouseLeaveControls`·Supabase repository Jest | 탈퇴 확인 뒤 RPC 실행과 캐시 초기화 경로 확인 | `006_house_leave_and_succession_test.sql`은 local Supabase 부재로 미실행; 소유 가구 회수는 item/placement schema가 도입되는 후속 migration에서 같은 RPC에 추가 필요 |
| 2026-09-23 | 서버 카탈로그 | Node 22 `catalog:seed`, Jest 전체, typecheck·lint·웹 export | 28 suites·82 tests, 55종·고정 슬롯 SQL seed, DB 가격 mapping, 8개 카테고리 filter, `/shop` 웹 번들 확인 | local/remote Supabase migration·seed와 실제 계정 상점 조회는 미검증; Jest는 async handle 경고로 `--forceExit` 사용 |
| 2026-09-23 | 구매·인벤토리 | Node 22 Jest·typecheck·lint | request-key 재시도, DB RPC mapping, 상점 구매 결과 조정·개인 보관함 경로 확인 | `purchase_inventory` migration의 local/remote transaction·RLS·동시 구매는 미검증 |
| 2026-09-24 | 오프라인 방 복구 | Node 22 connection state·repository guard·room/shop/decorate/invite UI Jest, typecheck | offline 상태에서 마지막 방·카탈로그·배치 정보가 보이고 출석·입주·구매·배치·동물 행동 명령이 제한되는 경로, 로그아웃 시 active snapshot 제거, foreground/reconnect invalidate 경로를 코드·Jest로 확인 | 실제 browser network toggle, local/remote Supabase 중단/복구와 iOS·Android reachability는 미검증 |
| 2026-09-24 | 추억 기여·개인 보관함 | Node 22 Jest·typecheck·lint | current/archive 분리 RPC mapping, 기여 RPC mapping, 30개 pgTAP 시나리오(직접 기여·revision·탈퇴 cutoff·원본 삭제·재입주)를 코드·정적 파일로 확인 | Docker daemon 부재로 `008_memory_contributions_access_test.sql` 미실행; 원격 migration·실제 A/B 계정 검증 미수행 |
| 2026-09-24 | 두 명 추억 가구 완료 | Node 22 typecheck·migration/pgTAP 정적 점검 | 두 명 distinct contribution 완료, memory-id 출처 고유, 완료 event, 세 번째 기여와 revision 재시도 비중복, viewer 기반 방 가구 노출 시나리오를 작성 | Docker daemon 부재로 `009_memory_completion_furniture_test.sql` 미실행; 원격 migration·실제 동시 기여 및 방 RLS 미검증 |
| 2026-09-24 | 알림 Outbox worker | Node 22 `npm run typecheck`, notification helper Jest | 비공개 내용 없는 payload, ticket 분류와 최대 1시간 retry backoff를 확인 | `supabase db lint`는 local Supabase가 실행 중이지 않아 실행 불가; `012_notification_outbox_test.sql`, Edge Function deploy/scheduler, Expo ticket·receipt/실기기 수신은 미검증 |
| 2026-09-24 | 집 생성·최초 membership 재검증 | Node 22 집 생성 화면·repository·홈 empty-state Jest | request key 재사용, 이미 활성 집 안내, 생성 결과 mapping, `1/4` 멤버 표시 경로를 확인 | `003_house_creation_test.sql`은 Docker daemon 부재로 미실행; 원격 create RPC·RLS·경쟁 요청은 미검증 |

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

1. `20260921000200_profile_animal_onboarding.sql`,
   `20260921000300_house_creation.sql`, `20260921000400_invite_lifecycle.sql`을 원격에
   순서대로 적용하고 생성 타입·실제 이메일 계정 온보딩·집 생성·초대 미리보기를 검증한다.
2. 유효 초대의 다중 수락, 마지막 자리 동시성, 초대 종료를 처리하는 입주 RPC를 구현한다.
3. 초대 수락 migration을 원격에 적용하고 생성 타입·실제 다계정 수락·마지막 자리
   동시성을 검증한다.
4. 탈퇴 migration을 원격에 적용하고 실제 탈퇴 직후 접근 차단·승계를 검증한다.
5. item/placement schema 도입 시 탈퇴 RPC에 개인 소유 가구 배치 회수를 추가한다.
6. `20260921001400`과 `20260921001500`을 원격에 적용하고, A/B 계정으로 탈퇴
   시점 이후 revision·사진 차단, 원작자 삭제 전파, 재입주 grant 미복원을 확인한다.
7. 이후 2인 추억 가구 완성, 쌍별 버릇 학습 순서로 연결한다.

아직 자동 검증하지 못한 핵심 규칙은 출석·구매 동시성, 활성 집 하나, 정원 초과,
탈퇴 후 RLS 차단, 추억 가구 멱등 생성, 같은 날짜 학습 중복 방지와 타 사용자 비공개
데이터 차단이다. PostgreSQL 마이그레이션과 원격 Supabase 환경이 추가된 뒤 검증한다.
