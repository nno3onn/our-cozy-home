# 우리집 기술 아키텍처

최종 수정일: 2026-09-22

제품 규칙은 [`product-spec.md`](product-spec.md), 상세 설계와 테스트 행렬은
[`superpowers/specs/2026-09-19-woorijip-design.md`](superpowers/specs/2026-09-19-woorijip-design.md),
현재 구현 상태는 [`progress.md`](progress.md)를 기준으로 한다.

## 시스템 경계

우리집은 Expo 기반 React Native 앱과 Supabase로 구성한다. 첫 버전에는 별도
Express·NestJS 서버를 두지 않는다.

| 영역 | 책임 |
| --- | --- |
| Expo Router | 인증·온보딩·탭·상세 화면, 딥 링크 복구 |
| React Native | 접근 가능한 폼, 목록, 패널과 오류·빈 상태 |
| React Native Skia | 기준 좌표 기반 방, 가구와 동물 렌더링 |
| Reanimated | 저장 상태와 행동 이벤트를 표현하는 애니메이션 |
| Gesture Handler | 동물·가구 터치와 슬롯 기반 드래그 |
| Zustand | 선택, 열린 패널, 꾸미기 모드 같은 일시적 UI 상태 |
| TanStack Query | 서버 조회, 캐시, 재연결·앱 복귀 재검증 |
| Supabase Auth | 세션과 사용자 식별 |
| PostgreSQL | 영구 데이터, RLS, 트랜잭션 게임 규칙 |
| Storage | 권한이 적용된 비공개 추억 사진 |
| Realtime | 변경 알림과 클라이언트 재조회 신호 |
| Edge Functions | 푸시 발송과 Auth 계정 삭제 같은 외부·고권한 작업 |

## 클라이언트 구조

화면은 도메인 repository 인터페이스에 의존한다. 앱 루트가 실행 모드에 따라
`DemoRepository` 또는 `SupabaseRepository`를 주입한다. 실제 연결 오류를 데모로
자동 전환하지 않는다.

```text
Screen -> feature hook -> repository interface
                            |-> demo repository
                            `-> Supabase repository -> table/RPC/Storage
```

서버 데이터를 Zustand에 복사하지 않는다. 코인, 멤버십, 소유권, 추억과 학습
상태는 Query 캐시의 서버 응답이 기준이다. 클라이언트 규칙 계산은 가격·완성 조건의
안내 미리보기에만 사용한다.

Skia 장면은 저장된 동물 상태와 행동 이벤트를 입력으로 받는다. 애니메이션 종료는
보상이나 아이템 지급 사건이 아니다. 일상 이동·표정은 기기에서 처리하고 먹이,
배치, 추억, 학습 결과처럼 영속적인 사건만 서버에 기록한다.

Supabase 모드의 `AuthProvider`는 세션을 복구한 뒤 현재 사용자의 `profiles`와
`animals`를 함께 확인한다. 둘 중 하나라도 없으면 온보딩 화면만 열 수 있고,
둘 다 있을 때에만 이후 집 흐름으로 이동한다. 이 확인이 실패하면 빈 프로필로
진행시키지 않고 재시도 화면을 보여준다. `complete_onboarding` RPC의 성공 결과는
클라이언트가 아닌 DB가 소유자와 최초 동물 생성을 확정한 결과다.

온보딩을 마친 사용자가 아직 활성 집을 갖지 않으면 집 생성 화면으로 안내한다.
`create_house(name, request_key)`는 사용자별 advisory lock 아래에서 동일 요청 키의
확정 결과를 먼저 반환한다. 새 요청에서 활성 멤버십이 이미 있으면
`already_in_house`를 반환하며, 집·admin 멤버십·요청 이력은 같은 트랜잭션에서 만든다.

## 데이터 영역

- 사용자: `profiles`, `animals`, `push_tokens`, `account_deletion_requests`
- 집: `houses`, `house_memberships`, `house_invites`, `invite_acceptances`
- 집 생성 멱등성: `house_create_requests`
- 경제: `attendance_rewards`, `purchase_requests`, `item_definitions`, `owned_items`
- 방: `room_slots`, `room_placements`
- 추억: `memories`, `memory_viewers`, `memory_contributions`,
  `memory_contribution_revisions`, `memory_photos`
- 버릇: `habit_definitions`, `habit_learning`, `habit_activity_days`,
  `habit_activity_participants`, `learned_habits`
- 알림: `notification_events`, `notification_deliveries`
- 설정: `app_settings`

활성 멤버십과 활성 초대는 부분 고유 인덱스로 각각 사용자당 하나, 집당 하나를
보장한다. 정원은 공통 설정의 값 4를 RPC가 집 행 잠금 후 확인한다. 출석은 사용자와
한국 날짜, 학습 일수는 학습과 한국 날짜의 고유 제약으로 중복을 막는다.

## 명령과 트랜잭션

다음 명령은 PostgreSQL RPC가 인증 사용자, 권한과 서버 기준 데이터를 확인하고
원자적으로 실행한다.

- 출석 100코인 지급
- 가격 조회, 잔액 차감과 구매 아이템 지급
- 집 생성과 최초 멤버십 생성
- 초대 생성·재발급·수락
- 탈퇴, 배치 회수, 학습 종료와 집장 승계
- 예상 버전을 사용한 가구 배치
- 추억 공유, 기여와 가구 한 번 생성
- 버릇 활동 기록과 획득

사용자 advisory lock, 집 행, 하위 자원 행 순서를 공통 사용한다. 출석, 구매,
초대 수락과 가구 생성은 고유한 멱등 키 또는 DB 고유 제약을 갖는다. 결과가
불확실한 네트워크 오류는 멱등 키로 기존 결과를 조회한 뒤 재시도한다.

## 권한

RLS는 활성 집 소속, 아이템 소유자와 추억 viewer grant를 기준으로 한다. 앱은
잔액, 아이템 소유권과 집장 권한을 직접 갱신할 수 없다. `security definer` 함수는
`auth.uid()`, 고정 `search_path`와 제한된 실행 권한을 사용한다.

초기 프로필·동물 생성은 `complete_onboarding(display_name, point_color,
animal_name, species)` RPC 하나로 수행한다. 함수는 `auth.uid()`만 소유자로 쓰고,
한 사용자당 하나인 `animals.profile_id` 제약을 upsert로 사용해 네트워크 재시도에도
두 번째 동물을 만들지 않는다. 프로필과 동물의 직접 insert는 허용하지 않으며,
현재 단계의 RLS는 자기 행 조회·수정만 허용한다. 같은 집 구성원 간 읽기 권한은
집·초대 보안 단계에서 추가한다.

추억 viewer grant는 공유 당시 멤버십에 연결된다. 탈퇴한 직접 기여자는
`access_ended_at` 이전 revision과 사진만 읽는다. 원본 삭제는 모든 viewer에게
적용하고 재입주는 이전 grant를 복원하지 않는다. Storage도 같은 관계를 검사한다.

## 생명주기와 개인정보

background·inactive 상태에서는 반복 애니메이션과 타이머를 멈춘다. active 복귀
시 세션, 멤버십과 화면 데이터를 다시 조회한다. 화면 종료, 집 변경, 로그아웃에서
listener, Realtime, 사용자 범위 캐시와 서명 URL을 제거한다.

사진 경로, 원문 초대 토큰과 인증 토큰은 로그에 남기지 않는다. 알림 본문은 비공개
추억 내용을 포함하지 않는다. 계정 삭제는 탈퇴와 별도 흐름이며 본인의 프로필,
초안, 기여 원본, 사진, 소유 데이터와 토큰을 정리하되 다른 사용자의 기여와 확정된
공동 추억 사건을 삭제하지 않는다.

## 마이그레이션과 초기 데이터

스키마, 인덱스, 함수, RLS와 Storage 정책은 `supabase/migrations`의 추가 전용
migration으로 관리한다. 적용된 파일을 덮어쓰지 않는다. 앱 시작이나 배포 과정은
원격 데이터를 자동 초기화하지 않는다.

시드는 공통 설정, 40개 상점 아이템, 15개 추억 가구, 기본 버릇과 방 슬롯을
멱등하게 생성한다. 생성 DB 타입은 `src/types/database.generated.ts`로 관리한다.

## 검증 계층

- TypeScript 타입 검사와 ESLint
- Jest·React Native Testing Library 기반 도메인·화면 흐름
- pgTAP·SQL 기반 제약, RPC와 RLS 검증
- 별도 DB 연결을 사용한 동시 요청 검증
- Expo Development Build 기반 딥 링크·푸시·재실행·이미지 검증
- 실제 Supabase 계정 A/B 기반 입주→추억→탈퇴→접근 차단 시나리오

웹 앱, 데모 모드와 실제 iOS·Android 검증 결과를 서로 구분해 기록한다. 웹에서는
CanvasKit 의존 없이 같은 논리 좌표·터치 계약을 따르는 View 렌더러를 사용하고,
iOS·Android 방은 Skia를 사용한다.
