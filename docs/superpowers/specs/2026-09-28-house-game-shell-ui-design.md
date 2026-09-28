# 우리집 House Game Shell UI 설계

## 상태와 목표

상태: 사용자 시각 방향 승인 후 구현 계획 작성 전.

우리집의 첫 화면은 기능을 탐색하는 대시보드가 아니라, 친구 동물과 가구가 함께
지내는 하나의 방이어야 한다. 사용자가 앱을 열었을 때 먼저 떠올려야 하는 질문은
"무슨 기능이 있지?"가 아니라 "우리 애는 지금 뭘 하고 있지?"다.

이 설계는 현재의 Expo Router·repository·Demo Mode·서버 규칙을 바꾸지 않고, 그
위에 공통 `HouseGameShell`과 게임형 overlay를 도입한다. 첫 구현 범위는 홈/방,
동물 상세 Bottom Sheet, 꾸미기 보관함, 추억 앨범이다. 상점·초대·출석·추억 완성
모달은 같은 셸의 확장 대상으로 규격만 확정한다.

## 비주얼 원칙

- 방은 모바일 화면의 70~80%를 차지하며, 정보는 방을 가리지 않는 얇은 chrome과
  필요한 순간의 overlay로만 제공한다.
- 따뜻한 크림 배경, 아이보리 surface, 살구/코랄 primary, 세이지 secondary,
  연한 하늘 point, 진한 초콜릿 text, 연한 브라운 line을 사용한다.
- 모든 surface는 16/20/24px 반경, 오른쪽 아래 한 방향의 약한 그림자,
  손으로 만든 듯한 얇은 갈색 윤곽선을 공유한다. SaaS식 강한 사각 카드/그림자는
  피한다.
- 동물과 가구는 둥글고 말랑한 실루엣, 같은 시점과 그림자 방향을 사용한다.
  현재 도형 에셋은 이 계약을 지키는 placeholder이며 최종 일러스트로 오인하지
  않는다.
- 동물 상태는 "간식이 먹고 싶어요"처럼 행동/기분으로만 표현하고 접속 상태처럼
  보이는 표시는 하지 않는다.

## 공통 셸

`HouseGameShell`은 방 무대, 상단 chrome, 멤버 자리, 하단 탐색, overlay stack의
레이아웃만 소유한다. 코인·멤버십·동물·가구·추억 등의 진실 데이터는 계속
TanStack Query/repository가 소유한다.

### 모바일

1. 상단은 왼쪽의 집 이름 드롭다운, 오른쪽의 코인 pill과 설정 진입만 둔다.
2. 상단 아래에는 최대 네 개의 원형 멤버 초상/동물 표식과 빈 자리 `+`를 둔다.
   빈 자리는 admin에게만 초대 진입점이며, 현재 인원 `n / 4`의 접근 가능한 텍스트도
   함께 제공한다.
3. 중앙은 기준 좌표계를 유지하는 방이다. 동물과 가구를 이름표/개인 포인트 색으로
   구별하고 터치 영역은 어떤 viewport에서도 겹치지 않는다.
4. 하단은 `우리집 / 꾸미기 / 추억`의 3개 탭을 둔다. 각 탭은 아이콘만으로 의미를
   전달하지 않고 텍스트 레이블과 44px 이상 터치 영역을 가진다.
5. 현재 동물의 요구가 있으면 방 하단 위에 한 줄짜리 action prompt를 띄운다.
   동물·이름·상태와 주 행동만 보이며, 탭하면 해당 동물 Bottom Sheet를 연다.

### 데스크톱 웹

데스크톱은 390px 모바일 프레임을 가운데에 확대하지 않는다. 넓어진 방을 보여 주고,
왼쪽에 가는 세로 탭 rail, 상단 중앙에 멤버 자리, 오른쪽에 coin/settings를 둔다.
출석·꾸미기 보관함 같은 짧은 overlay는 방 오른쪽 또는 하단에 놓되 방의 동물과
핵심 가구를 가리지 않는 safe zone을 사용한다. 모바일과 같은 논리 좌표·동물 위치·
데이터를 사용하며 단지 viewport가 달라진다.

## 화면별 경험

### 홈/우리집

- 별도의 멤버 strip, 출석 카드, 동물 행동 side panel을 홈 본문에서 제거한다.
- 탭한 동물은 작게 bounce/react하고 선택 ring을 표시한다. 직접 탭은 `reacting`
  행동을 서버 명령으로 기록할 수 있지만, 실제 행동 선택은 상세 Sheet에서만 한다.
- 추억 가구는 방 위에서 다른 가구와 구별되는 작은 `우리의 추억` 표식을 가지며,
  탭하면 상세 화면을 연다.
- 첫 접속의 출석 가능 상태는 `오늘도 집에 왔네요! +100` 모달을 한 번 보여 준다.
  수령은 기존 서버 확정 RPC로만 실행하며, 응답 불확실 시 결과 조회 후 재시도한다.

### 동물 상세 Bottom Sheet

방을 dim 처리하지만 배경을 닫거나 교체하지 않는다. Sheet는 동물 일러스트/이름,
소유자, 기분 hearts, 사람이 읽을 수 있는 행동 상태, `간식 주기 / 놀아주기 / 쉬게
하기`, 최근 배운 버릇 순서로 표시한다. 닫기 버튼, scrim 탭, 키보드 focus trap과
스크린리더 dialog semantics를 제공한다. 동물 터치가 어려운 사용자는 prompt와
접근 가능한 목록에서 같은 Sheet를 연다.

### 꾸미기/보관함

- `꾸미기` 탭은 현재 방을 유지하며 하단 40~55% 높이의 inventory tray를 연다.
- tray 상단에는 `보관함 / 상점` segment와 카테고리 chip을 둔다. 상점은 같은 tray
  안에서 전환하고 별도 커머스 탭을 만들지 않는다.
- 상품/보유품 card는 방에 쓰는 preview, 이름, 작은 소유자 라벨, 배치 가능 여부를
  표시한다. 추억 가구는 개인 구매품과 구별해 `우리의 추억` 표식을 쓴다.
- 선택된 가구는 방의 대상 슬롯에 preview/highlight되고, 확인 버튼에서만 기존
  placement RPC를 호출한다. 다른 소유자의 가구는 표시만 하며 이동 선택지는 주지
  않는다.

### 추억 앨범

`추억` 탭은 일반 리스트/게시판 카드가 아닌 월별 스크랩북이다. 카드에는 사진
placeholder 또는 실제 사진, 제목, 참여자 작은 초상/이름, 날짜와 가볍게 기울어진
폴라로이드 윤곽을 둔다. 직접 기여한 탈퇴자 보관함은 "개인 보관함"으로 별도
구획하되 현재 공동 방과 섞지 않는다. 권한 cutoff/원본 삭제 정책은 data hook과
RLS에서 계속 보장하며, 카드 표현이 이를 우회하지 않는다.

두 번째 서로 다른 기여로 가구가 완성될 때는 일반 toast 대신 축하 모달을 연다.
추억 제목, 생성된 가구, `보관함에 두기`와 `방에 놓기`를 보여 주며, 실제 placement는
후자의 명시적 선택과 서버 충돌 검증 뒤에만 실행한다. 세 번째/네 번째 기여와
revision은 모달을 반복해 열지 않는다.

### 초대와 출석 확장

빈 멤버 자리를 누르면 "우리집에 친구를 초대해요" sheet를 연다. 집 이름, 초대한
사람, 현재 `n / 4`, 24시간 유효성, link copy와 코드만 표시한다. 초대 미리보기와
수락은 계속 서버 상태를 기준으로 하며, 화면을 보는 것만으로 자리를 예약하지
않는다. 4명일 때는 `집이 꽉 찼어요`를 표시한다.

출석은 별도 탭이나 행정식 화면을 만들지 않는다. 홈 최초 진입 모달에서만 수령하며,
coin pill은 서버가 지급을 확정한 뒤에만 `+100` animation을 보인다. reduced motion
환경에서는 숫자 변화/반복 동작을 즉시 정적인 텍스트로 대체한다.

## 컴포넌트와 상태 경계

```text
HouseGameShell
├── HouseChrome (house name, coin, settings, member slots)
├── RoomStage (RoomCanvas + accessible actor list)
├── HomePrompt
├── HouseTabBar / DesktopRoomRail
└── HouseOverlayHost
    ├── AnimalDetailSheet
    ├── DecorateTray (Inventory / Shop)
    ├── InviteSheet
    ├── AttendanceRewardModal
    └── MemoryFurnitureCompletionModal
```

Zustand에는 열린 overlay, 선택 동물/가구, 꾸미기 segment 같은 일시 상태만 둔다.
route 이동이 필요한 추억 상세/작성, 설정, 인증은 Expo Router가 계속 소유한다.
행동·출석·배치·초대·구매 mutation과 성공/실패/오프라인 상태는 feature hook과
repository가 소유한다.

## 오류·접근성·모션

- offline일 때는 방·마지막 snapshot·보관함은 읽을 수 있지만 출석, 구매, 초대,
  배치, 동물 행동의 확정 버튼을 비활성화하고 이유를 시각/스크린리더로 알린다.
- 빈 집은 혼자 집을 만들 수 있음을, 친구가 없을 때는 빈 자리 초대를, 추억이 없을
  때는 첫 기록 CTA를 방/앨범 문맥 안에서 안내한다.
- 초대 만료/정원 초과/코인 부족/업로드 실패/권한 상실은 기존 domain error를
  사용하되, overlay를 닫지 않고 복구 액션을 제공한다.
- 모든 icon-only control은 label을 갖고, bottom sheet/modal은 포커스 복귀와
  dismiss control을 갖는다. 이름·색·아이콘을 함께 써 같은 종의 동물/가구도
  식별한다.
- reduced motion에서는 idle breathing, bounce, coin counter, 완성 축하의 반복/큰
  이동을 없애고 짧은 opacity 변화만 허용한다.

## 구현 순서와 검증

1. 토큰/공통 셸/반응형 room safe zone과 홈 stage를 도입한다.
2. 동물 detail sheet와 prompt를 기존 동물 action hook에 연결한다.
3. room stage를 유지하는 decorate tray와 inventory/shop segment를 연결한다.
4. 스크랩북 memory list와 completion modal을 기존 memory hook·placement 명령에
   연결한다.
5. invite, attendance, desktop rail을 같은 overlay/chrome 규칙으로 확장한다.

각 단계는 Demo Mode와 Supabase Mode가 같은 component contract를 사용해야 하며,
기존 max 4, 개인 소유, 추억 viewer 권한, 서버 권위와 offline read-only 규칙을
회귀시키지 않는다. Jest는 overlay open/close·keyboard/accessibility label·mutation
연결·동시 placement 오류를 확인하고, web은 mobile/desktop viewport에서 room과
딥링크를 확인한다. 실제 iOS/Android 모션·스크린리더는 Development Build에서 따로
기록한다.
