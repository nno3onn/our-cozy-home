# Illustrated House UI Design

## 목표

`우리집`을 관리형 앱 화면이 아니라 친구 동물이 실제로 함께 사는 따뜻한 생활 게임으로
보이게 한다. 참고 이미지를 복제하지는 않지만, 창가의 햇살·둥근 동물·가구가 채운 방·
부드러운 보상 순간이라는 시각적 약속을 모든 화면에서 일관되게 구현한다.

이 변경은 UI와 자산 표현만 다룬다. 최대 4명, 사용자당 활성 집 하나, 개인 소유권,
추억 viewer snapshot, 서버 확정 mutation과 Demo/Supabase repository 계약은 바꾸지 않는다.

## 아트 디렉션

- 배경은 흰 종이가 아니라 늦은 오후 햇빛이 드는 작은 방이다. 벽, 창, 바닥, 선반,
  식물, 조명은 서로 다른 깊이의 장면 레이어가 된다.
- 동물은 둥글고 말랑한 실루엣, 얇지 않은 갈색 외곽선, 작은 눈과 최소한의 표정으로
  통일한다. 같은 종을 여러 명이 선택해도 이름 리본, owner point 색, 이름으로 구분한다.
- 가구는 3/4 시점의 짧은 그림자와 동일한 광원(오른쪽 위의 햇살)을 사용한다. 같은
  카테고리의 다섯 상품은 색만 바꾸지 않고 모양·장식·실루엣도 달라야 한다.
- 색은 크림·벌꿀·살구·세이지·하늘·코코아를 쓴다. 본문 대비는 충분히 유지하며,
  경고 외의 강한 빨강/검정과 장식 목적의 gradient는 쓰지 않는다.
- 폰트는 플랫폼 한국어 sans-serif를 사용한다. 큰 제목은 단단하고, 설명은 조용하며,
  게임 내 수치와 소유자 정보는 작은 보조 위계로 둔다.

### 토큰

| 역할 | 값 | 용도 |
| --- | --- | --- |
| 벽 크림 | `#FFF5E6` | 페이지와 방의 벽 |
| 나무 바닥 | `#EBCB9C` | 방 floor와 선반 |
| 코코아 잉크 | `#4B372B` | 외곽선, 제목, 핵심 버튼 |
| 살구 보상 | `#F49A86` | 획득·작성·확정 CTA |
| 세이지 상호작용 | `#9FC9B2` | 휴식·선택 상태 |
| 하늘 보조 | `#B8D8EB` | 놀이·정보 상태 |
| 종이 표면 | `#FFFDF8` | sheet, 카드, 상품 카드 |

반경은 room(28), sheet(28), 상품 카드(18), chip(999)처럼 역할별로 구분한다. 모든
그림자는 오른쪽 아래 방향이며, 배경과 동물에 과한 그림자를 더하지 않는다.

## 재사용 가능한 UI/아트 구조

```text
features/illustrated-ui/
  scene/         RoomBackdrop, FurnitureSprite, AnimalSprite, SceneLayer
  chrome/        HouseHeader, MemberAvatars, CoinPill, GameTabBar
  overlays/      AnimalSheet, InviteSheet, AttendanceModal, RewardModal
  catalog/       ItemThumbnail, ItemCard, CategoryChips
  scrapbook/     MemoryPhotoCard, ParticipantRow, MemoryAlbum
assets/illustrated/
  rooms/ animals/ furniture/ ui/
```

`RoomScene`은 1000×1000 논리 좌표를 유지하며, 방 배경과 배치된 가구·동물을 같은
scale 값으로 그린다. `ItemDefinition.thumbnailKey`와 `roomAssetKey`는 실제 자산 key를
가리키고, 상점·보관함·방은 같은 renderer를 사용한다. 자산이 없는 항목은
`assetStatus: 'placeholder'`로만 표시한다.

## 화면별 구성

### 홈 / 우리집

- 모바일: house name pill, coin pill, 네 명의 avatar slot, 큰 room scene, 현재 동물
  상태 prompt, 하단 게임 탭 순서다. 빈 slot은 관리자의 초대 entry point이고, 일반
  멤버에게는 빈 원으로만 보인다.
- 데스크톱: 좌측 좁은 game rail, 넓은 room scene, 우측에는 출석 또는 현재 상태의
  보조 panel을 둘 수 있다. 방 자체가 화면의 가장 큰 요소여야 한다.
- 동물 touch target은 최소 44px이고, 네 이름 리본과 target은 320px 폭에서도
  겹치지 않는다. 동물 상태는 접속 여부처럼 보이는 online dot을 사용하지 않는다.

### 동물 상세 Bottom Sheet

- scrim 위에 bottom sheet를 올리고, 선택 동물 일러스트가 sheet 상단 경계를 넘는다.
- 이름, owner, 기분, 현재 행동, 먹기/놀기/쉬기 버튼, 최근 습득 버릇을 한 장면에
  표시한다. 행동 버튼은 server mutation pending/offline에서 비활성화된다.
- 닫기·scrim dismiss·접근 가능한 dialog label·기존 actor로의 focus 복귀를 보장한다.

### 꾸미기 / 보관함

- room scene은 항상 유지한다. 하단 tray의 보관함/상점 segment, category chip,
  2열 가구 thumb, 선택 중인 가구의 room ghost를 제공한다.
- 현재 사용자의 가구만 선택·배치 가능하며, 다른 멤버 가구에는 owner label만 보인다.
- 실제 placement version과 slot conflict 결과를 그대로 따르고 UI는 성공을 추정하지
  않는다.

### 상점

- 살구 active category chip과 2열 item grid를 사용한다.
- 각 상품은 실제 `ItemThumbnail`, 이름, coin price, owned state를 표시한다. 상품
  클릭은 상세/구매 panel을 열고 purchase RPC 결과만 잔액·인벤토리에 반영한다.
- 코인 부족은 부족한 금액과 현재 지갑을 보여주며, 응답 미확정 요청은 result recovery
  뒤에만 재시도한다.

### 추억

- 월 제목 아래 세로 scrapbook photo card를 둔다. 카드에는 사진, title, 참여자 작은
  avatar, 날짜, 기여 수, 가구 상태를 넣는다.
- 현재 공동 앨범과 탈퇴자의 개인 보관함은 명확히 분리한다. archive는 퇴장 cutoff 뒤
  새 내용이 보이지 않는 기존 repository 결과를 그대로 표시한다.
- 새로 입주한 사용자가 과거 추억을 보지 못하는 권한은 카드/사진/상세 API 모두에서
  서버가 결정한다. UI는 빈 상태만 안내한다.

### 초대·출석·추억 가구 보상

- 초대는 작은 집 일러스트와 `현재 n / 4명`을 중심에 두고, token/link는 복사 action
  안에만 둔다. preview에는 사진·글을 노출하지 않는다.
- 출석은 햇살·동전이 있는 단일 reward modal이다. 하루 100 coin의 최종 결과는 RPC다.
- 추억 가구 완성은 어두워진 방 위에 새 가구와 두 동물의 작은 축하 장면을 올린다.
  이 modal은 contribution RPC가 이번 요청의 completion/furniture id를 반환할 때만 연다.

## 자산 제작 순서와 상태

1. 햇살 방 backdrop, 토끼, 고양이, 쿠션·탁자·식물 파일럿을 제작하고 390px/1280px
   실제 화면에서 선·그림자·비율을 확정한다.
2. room furniture 40종과 memory furniture 15종을 category별 sprite sheet 또는 투명
   PNG/WebP로 확장한다. 각 항목은 thumb와 room asset을 모두 제공한다.
3. 초대집, 출석 태양, 추억 가구 보상, 빈 상태용 소형 일러스트를 제작한다.
4. 최종 자산으로 바꾸기 전까지 catalogue와 progress 문서에 placeholder 상태를 유지한다.

생성형 도구를 사용할 때도 실제 앱에는 상업적으로 안전한 자체 생성 결과만 넣으며,
참고 이미지의 등장인물·구도·상표를 재현하지 않는다.

## 접근성·반응형·모션

- icon-only control에는 한국어 접근성 이름을 붙이고, 모든 press target은 최소 44px이다.
- Safe area, 320px 폭, 키보드, 큰 글자, reduced motion을 확인한다. reduced motion에서는
  동물의 반복 bounce와 가구 등장 확대를 멈추고 상태 변화만 즉시 반영한다.
- 오프라인에서는 마지막 scene snapshot과 선택 상태는 보이되 구매·입주·행동·배치는
  읽기 전용으로 남는다.

## 검증 기준

- 390×844 및 1280×720 웹에서 홈, 동물 sheet, 꾸미기, 상점, 추억, 초대, 출석을
  확인한다.
- 네 동물 target/name label은 겹치지 않고, 각 상품은 상점·보관함·방에서 동일한
  자산 key로 렌더한다.
- Demo Mode와 Supabase Mode가 같은 component contract를 사용한다.
- Jest UI regression, typecheck, lint, demo web export와 artifact 검사에 더해,
  실제 브라우저 검증과 실기기 미검증 범위를 `docs/progress.md`에 분리 기록한다.

## 제외 범위

- 이번 UI 재작업은 Auth/RLS/RPC schema와 게임 규칙을 변경하지 않는다.
- 실시간 동물 위치 동기화, 자유 배치 충돌 엔진, 유료 결제, 최종 iOS/Android 네이티브
  art performance 최적화는 별도 작업이다.
