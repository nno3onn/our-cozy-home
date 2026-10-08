# 우리집 구현·검증 현황

최종 수정일: 2026-10-07

기능을 완료할 때 코드 경로, 검증 명령과 결과를 함께 갱신한다. 자동화 검증,
로컬 Supabase 검증, 실제 계정·실기기 검증은 서로 대체하지 않는다.

## 2026-10-07 토스식 UI Foundation

- 완료: 중립 semantic color·spacing·radius·typography·elevation·z-index token을 추가하고,
  후속 화면 전환 중인 기존 화면을 위해 legacy token alias를 한시적으로 유지했다.
- 완료: 공식 Pretendard v1.3.9 Variable TTF와 OFL license를 저장소에 포함하고 Expo root에서
  앱 화면 렌더 전에 불러오도록 연결했다.
- 완료: AppText·AppButton·AppInput·AppPageHeader·AppSection·ListRow·BottomActionBar·
  InlineNotice·AppSnackbar·Skeleton 공통 컴포넌트를 구현했다.
- 완료: compact/medium/wide page gutter를 20/28/32px로 통일하고, header title wrapping,
  44pt icon action, 입력 오류, Snackbar FIFO, reduced-motion Skeleton 계약을 자동화했다.
- 검증: Node 22.14.0에서 typecheck·lint, Jest 58 suite/239 test, Demo Mode web export와
  SPA/secret artifact 검사가 통과했다. Pretendard TTF가 web export에 포함되는 것도 확인했다.
- 검증: export 정적 서버를 390×844와 1280×800 viewport에서 열어 방·네 동물·가구·이름표,
  compact 하단 탭과 wide 왼쪽 rail을 확인했다. 두 viewport 모두 가로 overflow가 없고,
  실제 텍스트의 computed font가 Pretendard이며 브라우저 warning/error가 없었다.
- 진행: 인증·온보딩·집·상점·추억·설정 개별 화면의 새 primitive 전환은 후속 Issue 범위다.
- 미검증: 이번 단계의 브라우저 확인은 로컬 Demo Mode이며 iOS·Android 실기기의
  Pretendard 렌더, safe area, keyboard, screen reader는 아직 검증하지 않았다.

## 2026-10-06 원격 A–E 집 흐름 검증

- 완료: `scripts/run-remote-house-e2e.mjs`가 비밀값을 출력하지 않고 임시 Auth 사용자
  5명을 생성·온보딩한 뒤 실제 production RPC를 호출한다.
- 완료: 하나의 활성 초대로 B/C/D가 순서대로 입주해 active membership이 정확히 4개가
  됐고, E의 수락은 `house_full`로 차단됐다.
- 완료: A 퇴장 시 가장 먼저 입주한 B에게 집장 권한이 이전됐다. B/C 퇴장까지 집은
  active였고 마지막 D 퇴장 직후 `archived_at`이 기록된 archived 상태를 확인했다.
- 완료: 순차 정원 시나리오를 다섯 번 실행했으며 모두 `scenario-passed`와
  `cleanup-finished`로 종료했다.
  매 실행 후 notification·초대 이력·membership·house·Auth 사용자를 정확한 생성 ID로
  정리하고 house/Auth ID가 남지 않았는지 재조회했다.
- 완료: 별도 3인 집의 마지막 자리에 D/E의 수락 RPC를 동시에 시작했다. production DB는
  정확히 한 요청만 `joined`, 다른 요청은 `house_full`로 처리했고 active membership은
  4개, D/E 중 active member는 한 명이었다. 이 시나리오를 두 번 통과했으며 종료 후
  Auth와 집 데이터도 모두 정리됐다.
- 완료: Node contract test 7개가 API key 선택, 고정 단계 로그, `house_full` 판정, 동시
  응답 분류, Auth 삭제 판정과 FK 안전 정리 순서를 검증한다.
- 미검증: 앱 화면의 4/4 갱신과 Realtime, iOS·Android 실제 기기.

## 기준 문서

- 제품 요구사항: [`product-spec.md`](product-spec.md)
- 기술 책임: [`architecture.md`](architecture.md)
- 기본값 결정: [`decisions.md`](decisions.md)
- 상세 기술 설계:
  [`superpowers/specs/2026-09-19-woorijip-design.md`](superpowers/specs/2026-09-19-woorijip-design.md)

문서가 충돌하면 구현을 멈추고 제품 명세와 기술 문서를 함께 고친다.

## 2026-10-03 동물 행동 RPC·실제 계정 검증

- 완료: `perform_animal_action` RPC가 활성 집과 구성원 권한을 확인한 뒤 동물 상태를
  저장한다. 다른 집 사용자와 탈퇴자는 같은 RPC로 동물 상태를 변경할 수 없다.
- 완료: 간식·놀이·휴식 버튼은 현재 저장 상태인 행동만 선택 색상으로 표시하고,
  저장 실패 시 동물 상세를 닫지 않은 채 재시도 안내를 노출한다.
- 완료: Database release gate run `37108585366`에서 전체 migration reset과 pgTAP matrix가
  통과했고, remote migration run `37108808179`에서 원격 적용과 dry-run 최신 상태 확인이
  모두 성공했다.
- 완료: Chrome의 기존 실제 Supabase 로그인 세션에서 동물 상세 열기(`reacting`)와
  `간식 주기`(`eating`) 저장을 실행했다. 상태 문구와 선택 버튼이 갱신됐으며, 브라우저
  새로고침 후에도 `간식이 먹고 싶어해요!` 상태가 유지되는 것을 확인했다.
- 완료: 공개 데모 주소 `https://our-cozy-home-eight.vercel.app`에서 동일한 간식 행동과
  선택 색상 전환을 확인했다. 이 공개 배포는 명시적 Demo Mode이므로 실제 DB 검증은
  위 로컬 실제 계정 결과와 구분한다.
- 미검증: iOS·Android Development Build에서의 동물 행동과 두 계정 간 Realtime 갱신.

## 2026-09-30 릴리스 게이트 정합화

- 완료: `20260921000100`부터 `20260929000100`까지의 추가 전용 migration, 결정적
  55종 seed, DB 함수/RLS/Storage 정책과 pgTAP release matrix를 저장소에 구현했다.
- 완료: GitHub Actions `Database release gate`가 local Supabase를 시작하고
  `db reset` → deterministic seed → `supabase test db`를 순서대로 수행하도록 구성했다.
  이 자동화는 Docker가 없는 개발자 로컬 환경을 대체하는 CI 검증 경로다.
- 완료: runtime hardening migration으로 return-table RPC의 열 이름 충돌, 탈퇴 시점
  추억 revision cutoff, 공유 초안의 최초 기여 보존, 알림 outbox 멱등성을 보완했다.
- 진행: 원격 `our-cozy-home` 프로젝트는 CLI에 link됐고, 고정 ref·명시 확인값·repository
  secret을 사용하는 수동 GitHub Actions migration workflow를 추가했다. 현재 개발 환경은
  원격 DB의 IPv6 주소에 route가 없어 `db push --dry-run` 직접 실행이 연결 전에 중단됐고,
  browser Dashboard는 로그인 세션이 없어 대체 적용하지 않았다. GitHub Actions도 secret
  미설정 상태라 dispatch하지 않았으며, migration push는 실행하지 않았다.
- 완료: Actions에서 의도적으로 다른 확인값(`VERIFY-ONLY`)으로 workflow dispatch를 실행해
  run `36807294039`가 `skipped`로 끝나는 것을 확인했다. migration job은 시작되지 않았고
  원격 DB에는 변경이 없었다.
- 미완료(외부 환경): 원격 `our-cozy-home` DB의 전체 migration 적용, Edge Function
  배포/스케줄러, 실제 이메일 계정 다중 사용자 검증, iOS·Android Development Build 검증.

## 2026-10-01 웹 프로덕션 smoke 검증

- 완료: `df04195` 기본 브랜치의 Vercel production deployment가 성공했다.
- 완료: 배포 URL의 `/` 요청이 HTTP 200, `text/html` 응답을 반환하는 것을 확인했다.
- 완료: 같은 deployment에서 `/decorate`, `/shop`, `/memories`, `/house/invite` 직접 요청도
  모두 HTTP 200, `text/html` 응답을 반환해 SPA rewrite 경로를 확인했다.
- 미검증: 이 확인은 HTTP 응답 수준의 smoke test이며, 실제 Supabase 로그인·초대·구매·사진
  업로드나 iOS·Android 동작을 검증하지 않는다.

이 절의 상태가 아래 과거 단계별 기록보다 우선한다. 아래 기록은 각 기능을 처음
작성했을 당시의 검증 이력을 보존한다.

## 현재 상태

- 완료: 제품 명세·기술 설계, Expo 프로젝트, 명시적 데모 repository, 4인 방,
  동물 터치 행동, 고정 슬롯 가구 교체, 추억 목록·상세, 데모 초기화
- 완료: 게임형 우리집 셸 — 4개 멤버 자리·반응형 방 무대·동물 Bottom Sheet·방을
  유지하는 꾸미기 보관함·월별 스크랩북 추억 앨범을 데모/웹 공통 component contract로 구현
- 완료: 모바일 스택 화면에 44×44pt 공통 뒤로가기 버튼을 추가했다. 이전 history가
  있으면 원래 화면으로 돌아가고, 직접 링크처럼 history가 없으면 각 화면의 안전한
  fallback(홈·추억 목록·상점·로그인)으로 이동한다. 웹 데스크톱 폭에서는 숨긴다.
- 완료: 공통 반응형 계약을 추가했다. 600px 미만은 한 열, 600–899px는 두 열, 900px
  이상은 데스크톱 방 레일·꾸미기 보조 패널과 세 열 목록(개발 에셋은 네 열)을 사용한다.
  상점·보관함·추억·에셋 목록은 최소 카드 폭을 유지하고, 설정·인증·집/초대·추억 작성
  화면은 스크롤·키보드 회피·safe-area 여백을 공유한다.
- 완료: 상점 8개 카테고리 × 5종과 추억 가구 3개 종류 × 5외형의 데이터 카탈로그
- 완료: Supabase CLI 고정, 로컬 `config.toml`, 추가 전용 migration·seed·SQL test
  디렉터리와 명시적 실행 명령 기반
- 완료: Vercel 프로덕션 프로젝트와 GitHub 저장소 연결, Expo static export(`dist`)와 SPA
  rewrite를 사용하는 공개 웹 데모 배포
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
- Supabase 도메인 스키마·함수·정책: migration/RPC/RLS 구현 및 CI local release
  matrix 완료, 원격 프로젝트 전체 적용·다계정 검증 대기
- 데모 모드: 구현됨(메모리 기반이며 앱 재실행 시 초기화)
- 자동화 테스트: 카탈로그·repository·배치·UI 흐름(아래 검증 원장 참고)
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
| 5.1 | 서버 카탈로그 | `item_definitions`·`room_slots`, 55종 결정적 seed와 seed 없이도 동작하는 카탈로그 게시 migration, 실제 repository 상점 조회·8개 필터 화면 작성 완료 | local CI의 migration-only reset과 production DB pgTAP에서 12개 슬롯·55개 상품·완성 에셋 9개 확인 | Chrome 연결 시간 초과로 실제 계정 상점 UI의 8개 카테고리 수동 클릭 검증은 미수행 |
| 5.2 | 구매·인벤토리 | 구매 요청·개인 소유 schema, 멱등 구매/결과 RPC, 상점 구매·보관함 화면 작성 완료 | demo 재시도·repository mapping·코인 부족 UI Jest 통과, 구매 SQL 시나리오 추가 | local/remote 동시 구매·RLS·새 세션 inventory 미검증 |
| 6.0 | 공동 방 배치 | placement schema·예상 버전 RPC·탈퇴 배치 회수·실제 snapshot 조회 작성 완료, 배치된 타인 가구의 제한적 RLS read와 타인 이동 UI 차단 보완 | repository RPC mapping·타인 가구 read-only UI Jest 통과, RLS SQL 시나리오 추가 | local/remote 동시 이동·슬롯 점유·탈퇴 경쟁·RLS SQL 실행 미검증 |
| 6.1 | 실제 방 snapshot·오프라인 읽기 전용 | online repository 가드, 마지막 query snapshot 표시, 방·상점·꾸미기·입주 UI 명령 제한, foreground/reconnect refetch 작성 완료 | 연결 상태·가드·캐시 정리·오프라인 UI Jest 통과 | 브라우저 네트워크 토글, local Supabase 중단/복구, 네이티브 reachability 미검증 |
| 7.0 | 추억 초안·공유 대상 snapshot | private draft·명시적 share RPC, `memory_viewers` snapshot RLS, 작성 화면·공유 대상 표시 작성 완료 | repository mapping·작성 UI Jest 통과 | local/remote SQL RLS·다계정 공유 검증 미실행 |
| 7.1 | 기여 revision·탈퇴 보관함 | 기여 단일 행+revision, 사진 메타데이터, 직접 기여자 archive·cutoff 서버 조회와 원본 삭제 전파 작성 완료 | repository current/archive mapping·SQL pgTAP 시나리오 파일·Jest 통과 | Docker 부재로 pgTAP 미실행, 원격 migration·A/B 탈퇴 후 cutoff 미검증 |
| 7.2 | 두 명 기여·추억 가구 | memory row lock, 출처 고유 memory item·완료 event, 현재 viewer 기반 방 노출 정책과 snapshot item 조회 작성 완료 | 22개 pgTAP 시나리오 파일·typecheck 통과 | Docker 부재로 pgTAP 미실행, 원격 migration·동시 두 번째 기여·다계정 방 노출 미검증 |
| 9.1 | 알림 Outbox·Expo Push | event/delivery/token target, DB lease·권한 재검증·receipt/재시도와 `send-push` Edge Function 작성·원격 배포 완료 | payload·ticket 분류·backoff Jest, 원격 `ACTIVE`, 비인증 HTTP 401 통과 | scheduler, Expo APNs/FCM·실제 기기 수신 미검증 |
| 10.0 | 계정 삭제 | 삭제 요청 RPC, 집 탈퇴 재사용·개인 원문/토큰/비추억 인벤토리 정리, 비식별 tombstone, `delete-account`·reconcile Edge Function·설정 확인 UI 작성 및 원격 배포 | repository·오프라인 guard Jest, account deletion pgTAP, 원격 `ACTIVE`, 비인증 HTTP 401 통과 | 전용 계정의 실제 Auth 삭제·공동 기록 보존 E2E 미검증 |
| 11.0 | 웹 배포·딥 링크 | Vercel SPA rewrite, Expo static export·artifact secret 검사, Auth redirect 설정 문서 작성 | demo 웹 export·artifact 검사 통과 | Vercel production 데모에서 `/`, `/invite/test-token`, `/memories/demo-memory` 200 확인. 실제 Supabase Auth redirect·로그인 흐름은 미검증 |
| 11.1 | 반응형·접근성·모션 | 주요 route의 SafeArea/scroll·키보드 회피, 44pt 버튼 계약, 동물 대체 행동·reduced motion·offline/empty/error 접근성 상태를 감사 | Room layout·button·screen Jest 회귀와 typecheck/lint 통과 | 390/1280 실제 브라우저, iOS/Android 스크린리더·키보드·모션 감소 미검증 |
| 11.2 | 반응형 UI/UX 정리 | 공통 1/2/3열 breakpoint, 목록 최소 폭, 넓은 화면 방/꾸미기 분할, 중앙 form/read 열과 공통 키보드 스크롤을 적용 | Node 22 `npm test -- --runInBand --no-watchman --forceExit` 47 suite/154 test, typecheck·lint·demo web export·SPA export 검사 통과 | 이 작업 환경의 브라우저 확장 차단 때문에 새 viewport 수동 확인 미수행; iOS/Android 검증 아님 |
| 12.0 | DB release matrix | 기능별 pgTAP 시나리오와 reset→seed→test GitHub Actions release gate 구성 | workflow 정적 파일·Supabase foundation 검사 통과 | Docker가 없는 현재 환경에서는 병렬 DB/RLS/Storage 실제 실행 미검증 |
| 12.1 | 실제 환경 E2E | 마스킹 규칙·A–E 다계정/production web/실기기 검증 matrix와 runbook 작성 | 자동화·문서 구분 확인 | migration 적용 권한·테스트 계정·production URL·iOS/Android 기기가 없어 실제 항목 미수행 |

## 검증 원장

| 날짜 | 대상 | 명령 또는 환경 | 결과 | 범위 제한 |
| --- | --- | --- | --- | --- |
| 2026-10-06 | 원격 Edge Function release | Supabase CLI deploy/list, 비인증 production HTTP smoke, Node 24 edge release contract, Actions run `37401591340` | `send-push`·`delete-account`·`reconcile-account-deletion` v2 `ACTIVE`, 세 endpoint HTTP 401, 5 contract test와 수동 release workflow 통과. 원격 생성 타입은 저장소와 동일 | 실제 Expo push·계정 삭제는 실행하지 않음. scheduler·APNs/FCM·실기기 미검증 |
| 2026-10-05 | 다섯 번째 가구 에셋 세트 | Node 24 전체 Jest·typecheck·lint·Supabase foundation·demo export, 로컬 웹 390×844·1280×800 | 49 suite/213 test와 정적·빌드 검사 통과. 10종 알파 PNG, 완성 49/placeholder 6, 상점 40종 전체 완성, 두 viewport 무가로 overflow·이미지 로드 성공 확인 | 로컬 개발 웹의 기존 `shadow*` deprecation warning 존재. 원격 migration·운영 배포·iOS/Android·저사양 기기 메모리 검증은 병합 후 수행 |
| 2026-10-05 | 최종 추억 가구 에셋 세트 | Node 24 전체 Jest·typecheck·lint·Supabase foundation·demo export, 로컬·운영 웹 390×844·1280×800, 원격 migration·main DB gate | 49 suite/221 test와 정적·빌드·pgTAP 검사 통과. 신규 6종 알파 PNG, 완성 55/placeholder 0, 두 환경·두 viewport에서 55개 이미지 로드·신규 이름·무가로 overflow·브라우저 error 0 확인 | 로컬 개발 웹의 기존 `shadow*` deprecation warning 존재. iOS/Android·저사양 기기 메모리는 미검증 |
| 2026-10-05 | 방 오브젝트 반응형·배경 연출 | Node 24 전체 Jest·typecheck·lint·demo export·SPA export 검사, 로컬 demo 웹 320×700·390×844·1280×800 | 49 suite/202 test와 정적·빌드 검사 통과. 동물·추억 가구가 방과 동일 비율로 축소되고, 배경에 이미 그려진 러그·창가 화분의 중복 스프라이트를 제거함. 세 viewport 모두 가로 overflow·브라우저 warning/error 없음 | 병합 전 리뷰에서 추억 가구 터치 영역과 위쪽 동물의 겹침을 추가로 발견해 왼쪽 선반 좌표로 이동 후 재검증. 로컬 웹 검증이며 운영 배포·iOS/Android 실기기 검증은 아님 |
| 2026-10-05 | 방 장면 반응형 이미지 좌표 | Node 24 전체 Jest·typecheck·lint·demo export·SPA export 검사, 로컬 demo 웹 320×700·390×844·768×1024·1280×800 | 49 suite/200 test와 정적·빌드 검사 통과. 방 배경을 논리 장면 크기에 제한해 배경·동물·가구가 같은 비율로 축소됨을 확인. 네 viewport 모두 가로 overflow와 브라우저 warning/error 없음 | 기본 셸 Node 19에서는 Supabase WebSocket 관련 2개 test가 실패했지만 지원 Node 24에서 통과. 로컬 웹 수동 검증이며 운영 배포·iOS/Android 실기기 검증은 아님 |
| 2026-10-05 | 네 번째 가구 에셋 세트 | Node 22 전체 Jest·typecheck·lint·Supabase foundation·demo export, 로컬 웹 390×844·1280×800 | 48 suite/199 test와 정적/빌드 검사 통과. 10종 알파 PNG, 완성 39/placeholder 16, 신규 이름 10개, 두 viewport 무가로 overflow·브라우저 오류 없음 확인 | 로컬 demo 웹 검증이며 원격 migration·운영 배포·iOS/Android·저사양 기기 메모리 검증은 아님 |
| 2026-10-04 | production 가구 카탈로그 게시 | PR #105 Database release gate, remote migration run `37179135239`, production catalog verification run `37179456526` | migration-only reset·전체 pgTAP·원격 migration history·production DB 읽기 검증 통과. 슬롯 12, 활성 상품 55, 상점 40, 추억 15, 완성 에셋 9, 비활성 0 확인 | Chrome production 탭 연결이 두 번 시간 초과되어 실제 계정 화면 수동 클릭은 검증하지 못함. 이미지가 실제로 존재하는 가구는 9종이며 나머지는 placeholder임 |
| 2026-09-30 | 모바일 뒤로가기 | `MobileBackButton` Jest, Node 22 전체 Jest·typecheck·lint·demo web export | 45 suite/139 test 통과. history back·직접 링크 fallback 자동화 검증, 타입·정적 검사·웹 export 통과 | in-app Browser가 localhost 접근을 확장으로 차단해 실제 브라우저 화면 검증은 미수행. iOS·Android 실기기 검증 아님 |
| 2026-09-30 | 반응형 UI/UX | Node 22 `npm test -- --runInBand --no-watchman --forceExit`, `npm run typecheck`, `npm run lint`, `EXPO_PUBLIC_APP_MODE=demo npm run build:web`, `npm run verify:web:export` | 47 suite/154 test 통과. 390/768/1280 breakpoint 단위 테스트, 4마리 터치 영역, 상점/추억 그리드, 설정 중앙 열, typecheck·lint·정적 웹 export를 확인 | Jest는 기존 비동기 handle 경고 때문에 `--forceExit` 사용. 브라우저 확장 차단으로 이번 변경의 수동 viewport 확인은 미수행이며, iOS·Android 실기기 검증이 아님 |
| 2026-09-30 | main DB release gate | GitHub Actions `Database release gate`: local Supabase 시작, `supabase db reset --local`, `supabase test db` | 성공. 현행 migration·결정적 seed·pgTAP matrix가 CI local PostgreSQL에서 통과 | 원격 `our-cozy-home` DB 적용, 실제 JWT 다계정·Storage API, iOS·Android 검증을 대체하지 않음 |
| 2026-09-30 | 앱 회귀 | Node 22 `npm test -- --runInBand`, `npm run typecheck`, `npm run lint` | 44 suite/137 test 통과, typecheck·lint 통과 | Jest는 Watchman recrawl 및 비동기 handle 경고를 출력함. 실제 Supabase/실기기 검증 아님 |
| 2026-09-29 | 게임형 우리집 셸·추억 앨범 | Node 22 `npm test -- --runInBand --forceExit`, typecheck, lint, demo export·artifact 검사; 로컬 브라우저 390×844·1280×720 | 41 suite/129 tests, 정적 검사·export·artifact 검사 통과. 네 동물·Sheet·꾸미기 트레이·스크랩북 경로를 브라우저에서 확인 | Jest는 기존 async handle 경고 때문에 `--forceExit` 사용. 웹 수동 검증이며 iOS·Android, 실제 Supabase 다계정 검증이 아님 |
| 2026-09-19 | 명세 문서 | `git diff --check` | 통과 | 코드 동작을 검증하지 않음 |
| 2026-09-24 | 서버 카탈로그·상점 조회 | `npm test -- --runInBand src/repositories/supabase/__tests__/SupabaseRepository.test.ts src/catalog/__tests__/catalog.test.ts src/features/shop/screens/__tests__/ShopScreen.test.tsx`, `npm run catalog:seed` | 3 suite/25 test 통과, 결정적 seed 재생성 | 실제 Supabase migration/seed·RLS 조회는 별도 환경이 필요함 |
| 2026-09-24 | 구매·인벤토리 | `npm test -- --runInBand --forceExit src/repositories/supabase/__tests__/SupabaseRepository.test.ts src/features/shop/screens/__tests__/ShopScreen.test.tsx` | repository 부족 금액 mapping·상점 부족 안내 22 test 통과 | `009_purchase_inventory_test.sql`은 작성했으나 Docker/local Supabase 부재로 미실행 |
| 2026-09-28 | 공동 방 배치 | `npm test -- --runInBand --forceExit src/features/decorate/screens/__tests__/DecorateScreen.test.tsx` | 타인 소유 배치는 표시하고 이동 제어를 제공하지 않는 UI 3 test 통과 | `013_room_placement_visibility_test.sql`은 작성했으나 Docker/local Supabase 부재로 미실행 |
| 2026-09-28 | 계정 삭제 | repository·오프라인 guard·settings Jest, `tsc --noEmit` | 삭제 요청→privileged Edge 호출 순서와 offline 차단 23 test 통과 | `014_account_deletion_test.sql`, Edge Function deploy와 실제 Auth 삭제는 Docker/원격 Supabase가 필요함 |
| 2026-09-28 | Vercel production 웹 데모 | `EXPO_PUBLIC_APP_MODE=demo npm run build:web`, `npm run verify:web:export`, Vercel production deploy, 공개 URL curl | Expo export와 artifact 검사 통과. `/`, `/invite/test-token`, `/memories/demo-memory`이 모두 200이고 HTML에 데모 모드 UI 포함 | 현재 배포는 명시적 Demo Mode. 원격 Supabase migrations/Auth/Storage/Edge Function과 실제 로그인 흐름은 배포·검증하지 않음 |
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

- 방: 햇살 창가 방을 중앙 러그가 비어 있는 미니어처 dollhouse 무대로 교체 완료
- 동물: 토끼·고양이·곰·강아지 본체를 미니어처 봉제 인형 스타일로 제공, 본체 애니메이션은
  제작 전
- 상점 아이템 40종: 카탈로그·렌더 메타데이터와 미니어처 제품 톤의 투명 PNG 교체 완료.
  체크 카페 커튼·네잎 식탁·꽃잎 방석·숲길 러그·책장 침대·튤립 램프·작은 야자수·
  딸기 우유젤리·민트 잎비스킷까지 상점·보관함·방이 같은 에셋 키를 사용
- 추억 가구 15종: 카탈로그·렌더 메타데이터와 미니어처 제품 톤의 투명 PNG 교체 완료.
  눈꽃 식탁·카세트 라디오·조개 라디오·구름 액자·별 액자·우표 액자까지 상점 카탈로그와
  방 렌더러가 같은 에셋 키를 사용하며, 액자의 사진 영역은 비공개 추억 내용을 합성하지 않은
  중립 면으로 제공
- 개발용 에셋 목록 화면: `/dev/assets` 구현, 데모 모드에서만 내용 표시; 형태화된 placeholder도 최종 PNG와 구분해 표시

개발용 목록에서 완성 일러스트와 placeholder를 구분해 확인한다. placeholder를 최종 에셋으로 보고하지 않는다.

## 두 번째 가구 에셋 세트 검증 (2026-10-04)

- 데모 웹 `/dev/assets`를 390×844와 1280×800에서 확인했다. 두 크기 모두 완성 PNG 19개와
  placeholder 36개가 표시됐고, 문서 너비가 viewport를 넘지 않았다.
- 새 10종은 상점·방이 같은 에셋 키를 사용하며, 생성 결과에 포함된 투명 채널을 보존했다.
- 실제 iOS/Android 방 배치, 저사양 기기 메모리 사용량, 원격 Supabase의 새 asset key 반영은
  이번 로컬 시각 검증에 포함하지 않았다.

## 세 번째 가구 에셋 세트 검증 (2026-10-04)

- 데모 웹 `/dev/assets`를 390×844와 1280×800에서 확인했다. 두 크기 모두 완성 PNG 29개와
  placeholder 26개가 표시됐고, 문서 너비가 viewport를 넘지 않았으며 브라우저 오류 로그는 없었다.
- 숲잎 커튼·구름 낮은 탁자·별 쿠션·데이지 러그·구름 둥지·구름 펜던트·선인장 친구·
  꿀밤 쿠키·밤하늘 라디오·나뭇잎 액자의 알파 채널과 실제 이미지 로드를 확인했다.
- 전체 Jest 48 suite/188 test, typecheck, lint, Supabase foundation 검사, demo web export와
  SPA export 검사가 통과했다.
- 실제 iOS/Android 방 배치와 저사양 기기 메모리 사용량은 검증하지 않았다. 원격 Supabase
  migration 적용과 운영 웹 확인은 PR 병합 뒤 release workflow에서 별도로 기록한다.

## 네 번째 가구 에셋 세트 검증 (2026-10-05)

- 별밤 커튼·책장 겸용 탁자·구름 쿠션·체크 피크닉 러그·딸기 캐노피·별자리 무드등·
  꽃핀 화분·생선 구름칩·별밤 식탁·숲속 라디오를 상점/추억 카탈로그와 방 렌더러가 같은
  에셋 키로 사용하도록 연결했다.
- 카탈로그 상태는 완성 PNG 39종(상점 31종·추억 8종), placeholder 16종(상점 9종·추억
  7종)이다. 추가 전용 migration이 원격 카탈로그의 thumbnail/room key와 상태를 함께 갱신한다.
- 10개 PNG가 모두 1254×1254 투명 채널을 가진 것을 확인했다. 데모 웹 `/dev/assets`를
  390×844와 1280×800에서 확인해 완성 배경 이미지 39개, placeholder 16개, 신규 이름 10개,
  가로 overflow 없음과 브라우저 경고/오류 없음도 확인했다.
- 전체 Jest 48 suite/199 test, typecheck, lint, Supabase foundation 검사, demo web export와 SPA
  export 검사가 통과했다. 원격 migration·운영 배포 결과는 PR 병합 뒤 별도로 기록한다.

## 다섯 번째 가구 에셋 세트 검증 (2026-10-05)

- 체크 카페 커튼·네잎 식탁·꽃잎 방석·숲길 러그·책장 침대·튤립 램프·작은 야자수·
  딸기 우유젤리·민트 잎비스킷·브런치 식탁을 상점/추억 카탈로그와 방 렌더러가 같은
  에셋 키로 사용하도록 연결했다. 상점 40종은 모두 완성 PNG 상태다.
- 카탈로그 상태는 완성 PNG 49종(상점 40종·추억 9종), placeholder 6종(모두 추억
  가구)이다. 추가 전용 migration이 원격 카탈로그의 thumbnail/room key와 상태를 함께 갱신한다.
- 10개 PNG가 모두 1254×1254 투명 채널을 가진 것을 확인했다. 데모 웹 `/dev/assets`를
  390×844와 1280×800에서 확인해 이미지 49개가 모두 로드되고 완성 49개·임시 6개,
  신규 이름 10개, 가로 overflow 없음도 확인했다. 상점은 `전체`를 기본 필터로 사용해
  390×844와 1280×800 모두 40개 상품 이미지가 전부 로드되고 깨진 이미지와 가로 overflow가
  없음을 확인했다. 모바일에서 간식 5개 필터와 전체 40개 복귀도 확인했다.
- 로컬 개발 웹에는 기존 React Native Web `shadow*` deprecation warning이 남아 있다.
  전체 Jest 49 suite/213 test, typecheck, lint, Supabase foundation 검사, demo web export와 SPA
  export 검사는 통과했다. 원격 migration·운영 배포·iOS/Android·저사양 기기 메모리 검증은
  병합 이후 별도 확인한다.

## 최종 추억 가구 에셋 세트 검증 (2026-10-05)

- 눈꽃 식탁·카세트 라디오·조개 라디오·구름 액자·별 액자·우표 액자를 추억 카탈로그와
  방 렌더러가 같은 에셋 키로 사용하도록 연결했다. 액자 3종은 실제 사진이나 글을 포함하지
  않는 중립 면으로 제작했다.
- 신규 PNG 6개는 모두 1254×1254 RGBA이며 모서리 알파 0, 알파 범위 0–255를 확인했다.
  카탈로그 상태는 완성 PNG 55종(상점 40종·추억 15종), placeholder 0종이다.
- 데모 웹 `/dev/assets`를 390×844와 1280×800에서 확인했다. 두 크기 모두 이미지 55개가
  로드됐고 깨진 이미지·임시 에셋·가로 overflow·브라우저 error가 없었으며 신규 6종 이름과
  전체 완성 안내가 노출됐다.
- 전체 Jest 49 suite/221 test, typecheck, lint, Supabase foundation 검사, demo web export와 SPA
  export 검사가 통과했다. Jest는 기존 비종료 핸들 경고 때문에 `--forceExit`로 종료했다.
  PR #114의 preview와 pgTAP, main DB release run `37303017533`, 원격 migration run
  `37303063145`가 통과했다. 운영 `/dev/assets`도 390×844와 1280×800에서 이미지 55개,
  깨진 이미지·임시 에셋·가로 overflow·브라우저 error 0을 확인했다.
- iOS/Android 실기기와 저사양 기기 메모리 사용량은 검증하지 않았다.

## 일러스트 UI 검증 (2026-09-29)

- 데모 웹: 390×844와 1280×720 브라우저에서 홈 장면·네 동물 터치 영역·멤버 4자리·
  데스크톱 탐색 레일을 확인했다.
- 데모 웹: 빌드 산출물에서 `/`, `/decorate`, `/shop`, `/memories`, `/house/invite` SPA
  route가 생성되고, export rewrite 검증을 통과했다. 브라우저 자동 확인은 홈 장면까지만
  성공했으며 `/memories` 직접 이동은 브라우저 확장 차단으로 별도 화면 검증을 완료하지 못했다.
- 실제 iOS/Android, 실제 Supabase 계정, 알림/딥 링크/사진 업로드는 이번 UI 작업에서
  검증하지 않았다. 웹에서 확인한 결과를 네이티브 기기 검증으로 간주하지 않는다.

## 첫 진입 폼 UI 전환 검증 (2026-10-07)

- 로그인·회원가입·온보딩·집 선택·집 생성·초대 미리보기/수락을 공통 `AppPageHeader`,
  `AppInput`, `AppSection`, `InlineNotice`, `AppButton`으로 전환했다. 기존 AuthProvider,
  repository RPC, 초대 token 보존과 request id 멱등성 계약은 변경하지 않았다.
- 실패 뒤 입력 유지, 회원가입 비밀번호 조건, 선택 동물 접근성 상태, 포인트 색상 설명,
  집 생성 충돌, 빈 초대·정원 초과·오프라인 오류의 alert semantics를 자동화 테스트로 확인했다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 60 suites/244 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다.
- 브라우저 자동 검증 환경이 localhost 요청을 차단해 320×700·390×844·768×1024·1280×800
  실화면 검증은 완료하지 못했다. 실제 iOS/Android의 키보드 회피·스크린리더·딥 링크 역시
  미검증이며, 완료된 것으로 보고하지 않는다.

## 우리집 셸 UI 전환 검증 (2026-10-07)

- 상단을 집 이름·`n/4`·코인·설정으로 단순화하고, 멤버 네 자리에서는 중복 인원 문구를
  제거했다. 빈자리는 관리자에게만 기존 초대 진입점으로 노출한다.
- 하단 탭과 wide rail은 selected accessibility state와 semantic brand 색을 공유한다. 동물
  상태 prompt는 한 줄 요약과 `보기`로 줄였고, 상세 sheet는 상태 ListRow·행동 선택·alert
  오류·최근 버릇 순서로 정리했다. 출석·초대 카드와 loading도 Foundation 표현으로 전환했다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 60 suites/246 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. compact/medium/wide shell 분기는 컴포넌트 테스트로 확인했다.
- 방 좌표·동물 이름표·서버 RPC는 변경하지 않았다. localhost 브라우저 차단으로 이번 변경의
  로컬 실화면 viewport 검증은 미완료이며 iOS/Android safe area·sheet·back gesture도 미검증이다.

## 상점·보관함·꾸미기 UI 전환 검증 (2026-10-07)

- 상점 40종과 8개 카테고리를 유지하면서 가로 카테고리 필터, 중립 상품 카드, compact
  2열·medium 3열·wide 4열 반응형 목록으로 전환했다. 카드 최소 폭을 확보하지 못하는
  360px 미만 환경에서는 자동으로 1열로 낮춘다.
- 상품을 누르면 이미지·가격·용도를 확인하는 바텀시트를 먼저 열고 확인 뒤에만 기존 구매
  RPC를 호출한다. 성공 결과는 남은 코인 snackbar로 표시하고, 코인 부족은 서버가 확정한
  현재 잔액·가격·부족 금액을 시트에 유지한다. 응답이 불명확할 때 기존 request id 기반
  구매 결과 복구 조회를 유지한다.
- 보관함은 상품 이미지·수량·개인 소유권을 한 목록에서 확인하게 했고, 꾸미기 tray는 선택
  상태를 semantic brand 색과 접근성 selected state로 함께 표시한다. 친구 소유 가구의
  선택 제한과 서버 placement version 충돌 계약은 변경하지 않았다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 61 suites/248 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. Jest는 기존 비종료 핸들 경고 때문에 `--forceExit`로 종료했다.
- compact/medium/wide 열 수와 구매 성공·부족·오프라인, 보관함 이미지·소유권, tray 선택
  상태는 컴포넌트 테스트로 검증했다. localhost 브라우저 차단으로 실제 viewport 렌더링과
  iOS/Android의 sheet·스크린리더·safe area는 검증하지 않았다.

## 추억·버릇 학습 UI 전환 검증 (2026-10-07)

- 추억 목록은 월별 1/2/3열 grid에서 가구 완성 여부·기여 인원·참여자를 표시하고, 개인
  보관함 카드에는 퇴장 시점까지 공개된 내용이라는 범위를 직접 표시한다. 상세 화면은 공유
  시점에 고정된 대상과 실제 기여 내용을 분리하고 비공개 사진 권한 안내를 유지한다.
- 추억 작성은 공유 대상·공유 전 비공개 상태를 먼저 보여주며, 키보드 스크롤과 입력 유지,
  초안 저장 실패·공유 실패·사진 업로드 실패를 구분한다. 업로드 실패 뒤 글과 선택한 사진을
  유지하는 기존 복구 계약을 보존했다.
- 버릇 학습은 배우는 동물과 가르치는 동물 이름, 서로 다른 날짜 3일 진행도, 완료 상태와
  배운 출처 유지 안내를 표시한다. progressbar에는 min/max/now 접근성 값을 제공한다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 62 suites/249 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. 디스크 압박을 피하기 위해 Jest cache는 사용하지 않았고,
  기존 비종료 핸들 경고 때문에 전체 검사는 `--forceExit`로 종료했다.
- Demo Mode 데이터 흐름과 컴포넌트 표현을 검증했다. Supabase의 habit repository 실제
  구현, 사진이 있는 실제 계정, localhost viewport와 iOS/Android 키보드·스크린리더는 이번
  UI 변경에서 검증하지 않았으며 완료된 것으로 간주하지 않는다.

## 설정·계정 수명주기 UI 전환 검증 (2026-10-07)

- 설정을 앱 환경, 계정과 집, 데모 도구 section으로 분리했다. 데모 초기화는 계속 Demo
  Mode에서만 노출하며 연결 실패 시 자동 모드 전환이 없다는 안내를 유지한다.
- 집 나가기 확인에 개인 동물·코인·인벤토리·버릇 유지, 구매 가구 개인 보관함 회수,
  집장 승계, 마지막 멤버일 때만 archive되는 규칙을 표시했다. 로그아웃·집 나가기·계정
  삭제는 서로 다른 행동과 확인 단계로 유지한다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 62 suites/249 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. Jest는 cache 없이 실행했고 기존 비종료 핸들 경고 때문에
  `--forceExit`로 종료했다.
- Demo Mode 초기화와 집 나가기 확인 UI를 자동화 검증했다. 실제 Supabase 계정 삭제,
  관리자 승계 결과, iOS/Android 실기기와 스크린리더는 이번 UI 변경에서 검증하지 않았다.

## 초대 관리·결과 오버레이 UI 전환 검증 (2026-10-08)

- 친구 초대 관리에 공통 page header와 24시간·수락 순서 안내를 적용했다. 활성 초대를
  재발급하거나 취소할 때 기존 링크·코드가 즉시 무효화되고 다시 활성화되지 않는다는 확인을
  거친 뒤 기존 RPC를 호출한다.
- 초대 생성·취소·실패 피드백을 semantic notice로 구분했다. 초대 token은 기존처럼 읽기
  전용 링크 입력에만 표시하며 오류 메시지나 로그에 추가하지 않는다.
- 추억 가구 완성 sheet는 제목·가구·원본 추억·두 명 기여 멱등성 설명 순서로 단순화하고,
  방에 놓기만 primary, 보관함에 두기는 secondary action으로 유지했다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 63 suites/250 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. 실제 모바일 공유 sheet, iOS/Android safe area와 실제
  Supabase 초대 재발급 동작은 이번 UI 변경에서 검증하지 않았다.

## 추억 범위 segment UI 전환 검증 (2026-10-08)

- 현재 집 추억과 개인 보관함을 상단 segment로 분리해 선택한 범위의 월별 목록만 렌더링한다.
  두 범위를 한 화면에 이어 붙이지 않으며 각 control은 selected accessibility state를 가진다.
- 현재 추억을 기본값으로 사용한다. 현재 열람 가능한 추억이 없고 개인 보관함만 있으면
  보관함을 기본 선택하고 현재 추억 control을 비활성화한다.
- 퇴장 뒤 추가된 내용 차단과 원본 삭제 전파 안내는 개인 보관함을 선택했을 때만 표시한다.
  viewer snapshot, archive cutoff와 Storage/RLS 계약은 변경하지 않았다.
- Node 22.14.0에서 typecheck·lint, 전체 Jest 63 suites/251 tests, Demo Mode web export와
  SPA 산출물 검사가 통과했다. 실제 퇴장 계정의 원격 archive 데이터와 iOS/Android
  스크린리더 segment 이동은 이번 UI 변경에서 검증하지 않았다.

## 다음 작업

1. 임시 계정 세트로 출석/구매/배치/탈퇴/추억/버릇 RLS와 멱등성 E2E matrix를 수행한다.
   특히 탈퇴 시점의 추억 snapshot, 원본 삭제 전파, 재입주 grant 미복원을 확인한다.
2. 배포된 `send-push` worker의 scheduler와 Expo Push/APNs/FCM 설정 뒤 실기기에서
   token·push·딥 링크를 확인한다.
3. 완성 에셋 55종의 iOS·Android 접근성/모션 감소/작은 화면과 저사양 기기 메모리 사용량을
   실제 기기에서 확인한다.

자동 DB release matrix가 커버하는 핵심 규칙은 출석·구매 동시성, 활성 집 하나,
정원 초과, 탈퇴 후 RLS 차단, 추억 가구 멱등 생성, 같은 날짜 학습 중복 방지와 타
사용자 비공개 데이터 차단이다. 이는 local Supabase CI 결과이며, 원격 서비스와
실기기 검증을 대체하지 않는다.
