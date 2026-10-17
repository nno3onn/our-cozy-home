# 제품 v3 구현 로드맵 — 한 번에 하나의 완성된 플레이 흐름

작성: 2026-10-17 · 상태: **실행 순서/검증 기준 제안, 이번 변경은 문서만**

> 후속 구현자는 해당 PR의 상세 계획을 먼저 만들고, 필요하면 `superpowers:executing-plans`로
> 한 단위씩 실행한다. 이 문서의 체크박스는 앞으로 할 일이며 완료 표시가 아니다.

**목표:** 친구와 함께한 시간이 눈에 보이는 집.
**구조:** Expo 화면→도메인 Repository→Supabase RPC/RLS/Storage/DB. 일시 모션·미리보기는
클라이언트, 영속 권한·자산·완성은 서버. Realtime은 조회 신호이며 private payload를 합성하지 않는다.
**기술:** Expo/React Native/TypeScript, TanStack Query, Zustand, Supabase PostgreSQL/Auth/Realtime.
**제품 기준:** [C01–C08](product-v3-proposal.md), [승인 대기 V3-D01–D07](product-v3-decisions-needed.md),
[현행 계약](product-spec.md), [작업 지침](../AGENTS.md).

## 1. 저장소 기준과 보존 상태

감사 기준 main: **`b0d705dc1efaf97e6fad15628bfff1ea3a768a45`** (#173 squash merge).
GitHub에서 아래 PR의 state/base/head를 읽고 로컬 main 코드와 대조했다. 이 표는 해당 시점
스냅샷이며 다음 구현 시작 시 fetch와 PR head를 다시 확인한다. PR head와 GitHub의 임시
merge_commit_sha를 혼동하지 않는다. 이번 문서 작성은 운영 Supabase 상태를 확인하지 않았다.

- 원래 경로 `/Users/nno3onn/Documents/우리집`, 브랜치 `codex/v3-placement-preview`,
  HEAD `76286654a1d701086a5f359c5d646481e8da5b9a`는 보존한다.
- 원래 HEAD는 현재 origin/main보다 22커밋 뒤이며 ahead0. 기본 porcelain 표시211항목과
  기존550파일 내용 해시를 기록했다(디렉터리 축약 항목 수와 실제 파일 수는 다름).
- 이 문서 작업은 별도 worktree의 `codex/product-v3-contract`, 위 main에서 시작했다.
  원래 dirty 변경·백업·다른 PR/로컬 통합 브랜치를 옮기거나 staging하지 않았다.
- 아래 ‘존재’는 정적 코드 위치를 뜻한다. ‘서버 적용’이나 ‘실제 두 친구의 플레이 성공’을 뜻하지 않는다.

| 위치 | 확인한 상태/정확한 SHA | main과의 차이·통합 원칙 |
| --- | --- | --- |
| [#164](https://github.com/nno3onn/our-cozy-home/pull/164) | OPEN Draft · `92d94f7f9bed03235d4c07c0c1965c9cb06fa67a` · base main | 전체 장식 렌더·깊이·터치·미리보기/취소/확정·allowedSlotIds 조인. main 미병합 |
| [#167](https://github.com/nno3onn/our-cozy-home/pull/167) | OPEN Draft · `226f624f905b1f4dccfd6d505613063a0849dd7e` · base main | 실제 query key/루트 구독·15초 권한조회·INSERT/UPDATE publication. main 미병합 |
| [#169](https://github.com/nno3onn/our-cozy-home/pull/169) | OPEN Draft · `9435dd86125e1477fc1c2779a5049e90d596246e` · base main | scoped house/request RPC·leave 직렬화·legacy 실행 차단·실제 경합 harness. main 미병합 |
| [#172](https://github.com/nno3onn/our-cozy-home/pull/172) | OPEN Draft · `a4918d2a02b6e2b75aca9a62638cdde45c96d9ee` · base main | 정보 ListRow가 내부 로그아웃을 비활성화하던 결함 수정. main 미병합 |
| [#168](https://github.com/nno3onn/our-cozy-home/pull/168) | OPEN Draft · `b904ed2b01493f35a206750c240cf5fd16dda0d7` · base codex/v3-room-rendering-preview | #164에 쌓인 커튼 배경 중복·창틀 정렬·crop 보정. #164 전체를 독립 main 패치로 중복 병합하지 않음 |
| [#170](https://github.com/nno3onn/our-cozy-home/pull/170) | OPEN Draft · `cadf00a1e2a416c83a5f787c07ef5c945d4f3013` · 검증 전용 | **병합 금지**. #164/#167/#169 충돌 해결·증거 참고용, 기능 PR 대체 아님 |
| [#173](https://github.com/nno3onn/our-cozy-home/pull/173) | MERGED · merge `b0d705dc1efaf97e6fad15628bfff1ea3a768a45` | AGENTS.md만 main에 추가. 위 기능 PR이 같이 병합된 것이 아님 |
| 로컬 통합 | `45d300f7bd5291127e4263ab0c52312ce2b2e486` · codex/v3-local-playtest | #170 앱 소스+#172 ListRow, 과거 69 suites/300 tests 기록. #170 자체 head의 297개와 구별 |
| 로컬 권한 UI 후속 | `37099886699072f8fcd8385dd650471f21e9acbf` · codex/house-access-boundary | actor/house 세대별 QueryClient·Repository, 늦은 snapshot/권한거부/로그아웃 경계. main·기존 PR에는 없음. 최종 통합·A/B UI는 후속 미완료 |
| 로컬 후속 통합 | `cf3ebabb0ea61bff709da68f497e92124fd5f3c8` · codex/house-access-integration | 첫 access 수정 적용 상태. 위3709988 후속을 포함하지 않으므로 최신 통합 완료라 보고 금지 |

### main에 실제 있는 것과 부족한 것

- 집/초대/승계/퇴장, 개인 경제/구매, placement, 추억 viewer/revision/완성/Storage,
  habit schema/RPC·알림/삭제의 파일이 있다. 원격 전체 적용·실제 플로우는 별도 증거가 필요하다.
- `HomeScreen`은 memory-shelf/floor-accent-left 중심이고 `SupabaseRepository`는
  ownedItems.allowedSlotIds를 빈 배열, coinBalance를0으로 반환한다. #164는 슬롯 연결을
  고치지만 wallet 문제까지 해결한 PR이 아니다.
- `AnimalSprite`는 정적 PNG, `AnimalDetailSheet`의 행복5/5는 상수다. 동물 행동 RPC는
  같은집 target을 허용하며 본인 전용 계약과 차이가 있다. 동물3종 반응 완료가 아니다.
- `MemoryDetailScreen`에는 B의 새 기여 폼이 없다. `DemoRepository.addMemoryContribution`은
  ID만 반환하고 `getMemoryContributions`는 빈 배열이다. SQL 완성 규칙이 있어도 C04/C05 완결 아님.
- `SupabaseRepository.listHabitLearning`은 not_implemented. Demo 진행 표시가 실제 조회 증거가 아니다.
- main의 Realtime hook 존재만으로 실구독이 되지 않는다. #167과의 차이 및 DELETE 비공개 계약을 본다.

### 원래 dirty checkout에 남은 후속 구현 — 먼저 읽고 추출할 것

아래는 main 미포함이며 이번 PR에 코드·migration을 복사하지 않는다. 소스와 테스트가
존재해도 그 경로의 전체 제품/서버 검증 완료를 뜻하지 않는다.

| 경험 | 로컬 위치/계약 | 다음 판단 |
| --- | --- | --- |
| C02/소유자 | `src/features/room/components/AnimalFrameAnimation.tsx`, `AnimalMotion.tsx`, illustrated animation assets; `20261011000300_animal_owner_actions.sql` | 프레임/귀·발 잔상·소유권·라이프사이클 회귀부터. 이미 있는 것을 새로 만들지 않음 |
| C03 이동·해제·undo | `src/features/decorate/hooks/useRoomEditing.ts`, commands, `20261013130048_room_edit_journal.sql` | #154 별도 추출, expected room revision·anti-griefing 검증. #164 범위 확장 아님 |
| C04/C05 | `MemoryContributionForm.tsx`, memories/drafts 및 복구 테스트, `20261014073347_idempotent_memory_drafts.sql` | main의 폼/재시도 공백을 메우는 최소 흐름으로 검증 |
| C06 | house-news service/UI, `20261013130041_house_news_since_visit.sql` | 권한필터·watermark·최대3·새 집 경계·실제 확정사건 검증 |
| C07 | greetings service/UI, `20261013130044_quiet_greetings.sql` | 상대 상태 쓰기 분리·제한/차단·원장권한. D07 승인 범위 확인 |
| C08 | `src/features/room/animalContext.ts` | bed/cushion/table state/message 매핑만 있음. 실제 생활장면·안전취소와 구별 |
| 무료 개인 지급 | `FreeFurnitureLibrary.tsx`, `20261013130053_free_basic_furniture.sql` | claim→개인 owned item 모델. 무료 공용35종으로 오인 금지, D02/D05 |
| 버릇 조회·활동 | `20261013055633_list_habit_learning_summary.sql`, habit_activity_connection 등 | 정책중단과 별개 연결 코드. 기존 기록 보존·D04 |

## 2. PR 단위 개발 순서

각 단계는 변경 파일·정상/실패/권한 예외·검증 범위를 먼저 잠그고, 회귀 재현 → 필요한 최소 수정
→ 자동/실제 검증 → 독립 Draft PR로 끝낸다. 아래 단계명은 새 GitHub 이슈 번호가 아니다.
현재 #151–#163, #165/#166/#171은 OPEN으로 확인했으며 이번에 상태·본문을 변경하지 않는다.

### 단계 0 — 기존 공동 꾸미기·Realtime·서버 권한의 안전한 통합 (P0 차단)

**사용자 결과:** A가 자기 가구를 미리보고 취소/확정하면 B도 보고, A가 나가면 A는 집 선택,
B의 방에서는 회수된 가구가 자동으로 사라진다. 재로그인·새 집·계정전환에 옛 비공개 데이터가 없다.

- [ ] #164/#167/#169/#172 정확한 head를 새 검증 worktree에 통합. #168은 #164 의존을
  유지해 별도로 시각 회귀. #170은 비교 참고만 하며 병합·추가 커밋하지 않는다.
- [ ] local access 최신3709988과 첫 통합cf3ebabb 차이를 확인, 늦은 조회/세션/이벤트/권한 거부
  회귀를 최종 통합본에서 재현. 권한 수정은 별도 최소 Draft로 정리한다.
- [ ] scoped RPC houseId/requestKey/expectedVersion 및 잠금 후 권한 재검사와 구RPC 차단을
  보존한다. 퇴장/UI/API 오류로 구RPC fallback을 만들지 않는다.
- [ ] 통합 출발점의 기존 300개 테스트 목록을 비교해 전부 보존. #164 독립284,
  #167 독립267, #169/#172 독립261 등 **각 PR의 과거 기록**을 현재 한 환경의 합계로 더하지 않는다.
- [ ] TypeScript/ESLint/전체 Jest, Demo·Supabase 웹 빌드/export, SQL/RLS reset/seed/no-seed,
  분리 트랜잭션 경합을 최신 통합 SHA에서 실행한다. 실패는 baseline/new/environment로 구분한다.
- [ ] 격리 Supabase A/B 실제 UI에서 선택→미리보기→취소→재선택→확정→B확인→reload→
  UI 로그아웃/로그인→동일 item/slot/version 확인. B stale preview 충돌·교체도 확인한다.
- [ ] A퇴장과 조회, 로그아웃과 Realtime, 옛 집 지연 요청과 새 집 입주를 겹친다.
  A즉시이동, B회수 자동수렴(수동reload로 대체 금지), 직접 URL 차단, 새계정 캐시0,
  권한거부+캐시 동시 존재, 오프라인/재연결을 DB/화면 양쪽에서 확인한다.
- [ ] 320px/1280px·4인 전체슬롯·동물/추억 hit area, 커튼 preview/cancel 복원을 확인한다.
  iOS/Android 물리기기 불가 시 미검증으로 남기고 출시 승인 근거로 쓰지 않는다.

**증거의 현재 경계:** #169/#170 보고서에는 실제 SQL/RLS·경합·Auth/REST/WebSocket 성공이 있고,
#172에는 단일 에이전트가 A/B 실제 브라우저로 UI 로그아웃·배치 재로그인 유지까지 확인한 기록이 있다.
자동 퇴장 제거 수렴·권한거부 중 캐시 UI·사람 두 명·실기기는 남았다. 이번 문서 PR은 그 테스트를
재실행하지 않았다. 원격 rollout은 새클라이언트/서버 전환계획과 별도 승인이 있어야 한다.

**종료 기준:** 위 핵심 권한·영속·UI 차단은 실검증 증거로 닫는다. 다른 차단을 모조리
‘기반 작업’으로 끌어오지 않는다. wallet·경제 UI 결함은 범위를 정한 후속으로 남긴다.
가장 먼저 필요한 것은 access 후속의 통합과 실제 A/B 퇴장 흐름 검증이다.

### 단계 1 — 만지면 반응하는 내 동물 (C02, #155)

**사용자 결과:** 자기 동물을 알아보고 터치/놀이/휴식에서 서로 다른 세 반응을 즉시 본다.

- [ ] 기존 Sprite/Actor/상세 및 로컬 FrameAnimation/Motion/프레임 bounds를 읽고, 귀/발 잘림·
  눈 떨림·연타·집전환 결함을 실패 회귀로 만든다. 새 종·새 재화·새 기분 DB를 추가하지 않는다.
- [ ] 기존 에셋의 기준점·연속성·모션 감소·background중지를 고친다. 본인 영속변경만 허용하는
  client+RPC를 연결하고 친구 터치의 일시 반응/C07과 분리한다.
- [ ] Demo3개 반응, 실제 A→B 영속변경 거부/A자기성공, Web320/1280과 Native 모션/접근성을
  각각 확인한다. 첫500ms·연속프레임은 측정 근거를 남긴다.
- [ ] 사용자에게 내 동물/세 반응을 설명 없이 식별시키고 어색함·자발적 재터치를 관찰한다.

**주요 파일:** room components/AnimalDetailSheet, illustrated scene, domain/repository, 소유자 RPC 새 migration.
**의존성:** 단계 0 권한 경계. **제외:** 3일 학습 개편·코인 보상·원본캐릭터 전면교체.

### 단계 2 — 두 사람의 한 줄이 같은 가구가 되는 흐름 (C04+C05, #156/#161)

**사용자 결과:** A 비공개 초안→명시 공유→B 자기 한 줄→가구 1개→소유자 A의 보관함/배치→허용된 A/B의 가구 터치 원본.

- [ ] main MemoryComposer/Detail, 로컬 ContributionForm/drafts 복구, 기존 share/add/complete SQL을
  대조한다. Demo ID반환 stub을 실제 상태전이로 검증하되 영속모드로 바꾸지 않는다.
- [ ] B입력/저장·공백거부·실패입력보존·사진선택적 재시도를 연결한다. 완료가구ID/사건은
  실제 응답·재조회로만 표시하고 ‘3명째 기여/재시도’에 생성/축하를 반복하지 않는다.
- [ ] A/B 실제 UI·두번째 기여 동시성·새로고침·로그아웃·후입주/퇴장 cutoff/원본 삭제·Storage를
  SQL+화면에서 확인한다. 일반 라디오와 추억 출처 라디오의 경로도 확인한다.
- [ ] 2인 사용자가 서로 다른 관점을 적고 가구에서 다시 읽는지 관찰한다. 4인에서
  3/4번째 기여·후입주자의 비공개 존재 누출도 검사한다.

**주요 파일:** memories screens/components/hooks/photo, Demo/SupabaseRepository, 기존 memory SQL/테스트.
**의존성:** 단계 0 렌더/preview·안전권한; #154 전체undo·무료정책·C07은 선행 아님.
**제외:** 공용 소유 전환·유료/랜덤 보상·새 알림 채널.

### 단계 3 — 가구에서 생활하는 동물 (C08, #155 후속)

**사용자 결과:** 확정 배치 침대/쿠션/탁자에서 세 가지 다른 생활 몸짓을 보고 자연 복귀한다.

- [ ] 로컬 animalContext의 state/message와 실제 연출을 구분하고 기존 reaction controller에 연결한다.
- [ ] 슬롯기준점·깊이·일시동작 종료를 구현하고, preview/회수/집전환/권한거부/background에 취소한다.
- [ ] A/B배치 갱신·오프라인 읽기·모션 감소·320/1280/네이티브에서 세 장면을 검증한다.
- [ ] 사용자가 설명 없이 가구와 동작의 관계를 이해하고 꾸미기를 다시 시도하는지 본다.

**주요 파일:** animalContext/room animation, RoomScene, catalog interaction/anchor와 관련 테스트.
**의존성:** 단계 0+C02. 계획 실행 순서는 단계 2 뒤. **제외:** 자유보행AI·새학습일수·공동 포즈(#162).

### 단계 4 — 지난번 이후 친구가 남긴 변화 (C06, #157)

**사용자 결과:** 부재중 친구의 확정 배치/추억 완료 0~3건을 보고 해당 장면으로 간다.

- [ ] 로컬 house-news 서비스/SQL을 검토해 확정사건만 입력, permission filter→limit,
  joinedAt/readAt/ack 경계와 본인 제외·중복·동시사건을 실패 회귀로 고정한다.
- [ ] 정상/빈/조회실패/오프라인/권한거부 표시와 성공한 표시 뒤 ack를 완결한다.
- [ ] 실제 A부재→B변경→A복귀, 조회-ack 사이 새사건, 후입주·재입주·타 계정 캐시·
  비공개사건 존재/카운트 비노출을 DB+UI로 확인한다.
- [ ] 320/1280와 네이티브 복귀, 변화 발견 시간과 감시/압박 반응을 관찰한다.

**주요 파일:** house-news 서비스/패널, 관련 조회·방문 RPC 새 migration, 기존 확정 사건 연결.
**의존성:** 단계 0+C05, 원장/보관 D07. **제외:** 무제한 활동로그·‘오늘’출석·미열람숫자 경쟁.

### 단계 5 — 부담 없는 작은 인사 (C07, #160)

**사용자 결과:** A친구동물 인사→B수신확인→음소거/차단/숨김까지 가능하며 상태변경은 없다.

- [ ] 로컬 greetings code/SQL에서 auth/membership·requestKey·원자쿼터·개인수신함을 감사한다.
- [ ] D07의 제한/보관 승인 범위 내에서 전송/중복/불명응답·수신 제어·계정경계까지 연결한다.
- [ ] 실제 A/B와4인 동시발송·다른 집·퇴장·차단·재입주, Web320/1280/Native복귀를 확인한다.
- [ ] 실제 친구쌍이 답례 압박 없이 가치를 느끼는지 확인하고 빈도/기능 확대를 결정한다.

**주요 파일:** greetings service/UI, 별도 제한·조회·수신설정 SQL/테스트, 동물상세 진입점.
**의존성:** 단계 0+C02+D07. **제외:** 채팅·푸시추가·선물경제·읽음경쟁.

### 정책·후속 분기 — 경험 PR을 막연히 기다리게 하지 말 것

- #151/#152/#159: V3-D01–D06 승인 및 별도 이전 계획. 코드 삭제를 선행하지 않는다.
- #154: 기존 이동·해제·guarded undo/room revision 복구를 별도 완성 흐름으로 추출.
  같은 슬롯 친구가 이후 편집한 결과를 undo로 지우지 않는 anti-griefing 계약이 필요하다.
- #153/#163은 #164의 실제 서버/기기 수용 기준을 확인한 뒤 종료 판단; #165/#166도
  #169/#167 병합만으로 자동 종료하지 않는다. #171은 #172 실제 적용과 UI 회귀 뒤 판단한다.
- #158 QA는 모든 단계에 동행한다. #162 공동 포즈·벽지·계절 실험은 핵심 흐름 검증 뒤.
- 기존 `.github/codex-issues/001–031`은 v1 이력/회귀 참조다. 경제·학습을 v3 선행 필수로
  재개하거나 이미 있는 RPC를 새로 만드는 체크리스트로 쓰지 않는다.

## 3. 검증 행렬과 합격 증거

| 층 | 실행할 검증/반례 | 성공 근거 |
| --- | --- | --- |
| 화면 | 시작→결과, 로딩/빈/오류·권한·연타·키보드·모션 감소 | 실제 동작·캡처·관찰. fixture 문구 표시만으로 성공 아님 |
| Repository | Demo/Supabase 명령·조회·불명 응답·멱등 재시도 | 실제 반환/상태와 mock의 경계 명시 |
| RPC/DB | actor/house/owner/slot/version·UNIQUE·부분 실패·경합 | 별도 연결 트랜잭션과 최종 행·원장·자산 불변량 |
| RLS/Storage | 후입주·퇴장·재입주·원본 삭제·비공개 존재·signed URL | 실제 제한된 JWT/API 실패와 권한 있는 성공 |
| 재접속 | reload/로그아웃/다른 계정/새 origin/다른 집·지연 응답 | 동일 item/slot/version, 옛 비공개 데이터0, 현재 서버와 일치 |
| 1인 | 새 집·내 동물 반응·보유 가구·비공개 초안·친구 없음 | 혼자 가능한 범위, 경제 장벽·미승인 무료 정책의 공백 표시 |
| 2인 | 초대·배치 전파·충돌·공동 기여→가구·인사·퇴장 | 실제 두 계정 브라우저와 사람 두 명의 플레이 결과 구분 |
| 4인 | 네 동물/이름·hit area, 마지막 자리, 3/4번째 기여, 동시 편집 | 정원 4·distinct 기여·기밀·자산 불변·화면 겹침 없음 |
| Web | 320px·1280px, 큰 글자·tab/focus·뒤로가기·직접 URL | 문서 폭/컨트롤 가시성·탐색. 내부 스크롤과 바깥 잘림 구분 |
| Native | iOS/Android Development Build·물리 기기·network/background·보조기술 | 기기/OS/빌드 SHA 명시. Web·Jest·simulator로 대체 금지 |
| CI/배포 | GitHub Actions 실제 checks, Vercel 배포 상태 | 로컬과 분리. skipped는 실행 성공 아님, deploy 성공은 게임 검증 아님 |
| 사용자 가치 | 솔로·친구쌍·4인 관찰, 단순 대안 비교·축소 기준 | 실제 행동·실패·도움·평점 분포. 목표4.8을 성과로 쓰지 않음 |

주요 반례는 여러 탭의 leave/조회 경합, A 로그아웃 뒤 B로 바뀐 순간 A 응답 도착,
B 화면에서 회수되는 가구 미리보기, unknown 오류와 cache 동시 존재, permission denied와
오프라인의 연속 발생, 공유 뒤 후입주자와 원본 삭제, 사진·글의 부분 성공이다.
캐시 차단은 서버 권한의 대체가 아니다.

## 4. 이번 문서 PR의 검증과 미검증

실행 대상은 Markdown 변경 범위, 상대 링크·참조 파일, C01–C08 필수14차원,
V3-D01–D07 영향/정책/이관/복구/테스트/승인, AGENTS 기존 규칙 보존,
명세/결정/기존 이슈 이력 보존, 기존 파일 해시·HEAD, `git diff --check`다.
최종 실제 결과는 PR 본문에 기록한다. 문서의 수용 기준을 테스트 통과로 표시하지 않는다.

이번에는 TypeScript·ESLint·Jest·웹 빌드/export·SQL/RLS·브라우저·기기를 실행하지 않는다.
앱/테스트/SQL/의존성 변경은 없으며, 기존 테스트 소스와 configuration이 그대로인지 diff로 확인한다.
이것은 기존 300개가 최신 통합본에서 재통과했다는 뜻이 아니다. GitHub Actions도 docs 경로가
실행 대상이 아니면 미실행으로 기록한다. 원격 배포는 차단하며 DB 적용·자산 삭제·병합은 하지 않는다.

## 5. 다음 세션 재개 절차

1. AGENTS→proposal→decisions-needed→이 문서→현행 spec/architecture/결정 이력을 읽는다.
2. 현재 main/PR head/dirty/worktree를 확인하고 기존 구현·진행 중 로그·작업별 계약을 보존한다.
3. 단계 0의 access 최신 후속을 기존 통합본에 적용할 별도 검증 브랜치를 준비한다. #170은 병합 금지다.
4. 기존 테스트를 먼저 확보하고 A 퇴장→A 안전 화면/B 자동 회수 제거 시나리오를 실제로 끝낸다.
5. 차단 해소와 승인된 통합 이후 C02의 작고 완전한 동물 반응 PR을 시작한다. 매 단계가
   실제 사용자 결과를 가져야 하며 새 기반 작업은 그 결과에 필요한 범위만 허용한다.
6. 미검증·승인 대기 항목은 그대로 남긴다. 문서/PR 작성만으로 기능/재미/운영 적용 완료라 하지 않는다.
