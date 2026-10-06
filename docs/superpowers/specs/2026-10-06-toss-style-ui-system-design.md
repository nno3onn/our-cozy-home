# 우리집 토스식 UI/UX 시스템 설계

작성일: 2026-10-06

상태: 사용자 방향 승인 완료, 구현 계획 작성 전

## 1. 목적

우리집의 전체 UI를 토스처럼 빠르게 이해되고 일관되게 조작할 수 있는 제품 화면으로
정돈한다. 토스의 화면을 복제하거나 전용 자산을 사용하지 않는다. 명확한 정보 계층,
간결한 문장, 충분한 여백, 한 화면에 하나의 주요 행동, 예측 가능한 피드백이라는 UX
원칙을 우리집의 모바일·웹 코드에 맞게 적용한다.

우리집의 고유한 시각 자산은 봉제 인형 동물, 미니어처 가구, 햇살이 드는 방이다. 이
자산은 그대로 유지한다. 앱의 chrome, 정보 화면, 폼, 목록, sheet와 상태 표현을 중립적인
제품 UI로 바꿔 장면과 콘텐츠가 더 잘 보이게 한다.

이번 변경은 UI 표현과 상호작용 구조만 다룬다. 최대 4명, 사용자당 활성 집 하나,
개인 지갑과 소유권, 추억 viewer snapshot, 버릇 학습, Supabase RPC·RLS, Demo Mode와
실제 Mode의 repository 계약은 변경하지 않는다.

## 2. 기존 설계와의 관계

이 문서는 다음 설계의 제품 규칙과 화면 구조를 유지한다.

- `2026-09-19-woorijip-design.md`: 데이터, 권한, 서버와 클라이언트 책임
- `2026-09-28-house-game-shell-ui-design.md`: 방 중심 셸과 overlay 구조
- `2026-09-29-illustrated-house-ui-design.md`: 동물·가구·방 아트 방향
- `2026-09-30-responsive-ui-ux-design.md`: compact·medium·wide 구간

다음 시각 규칙은 이 문서가 대체한다.

- 크림·코코아 UI chrome을 모든 화면의 기본 표면으로 사용하는 규칙
- 패널마다 테두리와 그림자를 함께 사용하는 규칙
- 화면마다 따로 구현된 제목·뒤로가기·주요 행동 배치
- 안내 문장을 여러 caption으로 분산하는 방식
- 선택 상태와 주요 행동에 민트·살구·하늘색을 혼용하는 방식

방 배경과 투명 동물·가구 이미지 안의 따뜻한 색은 바꾸지 않는다. 중립 UI가 방 장면을
둘러싸고, 사용자별 point color는 소유자 식별에만 사용한다.

## 3. 현재 UI 감사

### 유지할 것

- 방을 앱의 대표 화면으로 사용하는 `HouseGameShell`
- `우리집 / 꾸미기 / 추억`의 3개 주 탐색
- 동물 상세 bottom sheet와 방을 유지하는 꾸미기 tray
- 1000×1000 기준 좌표와 반응형 장면 배치
- 상점 40종과 추억 가구 15종의 완성 에셋
- 최소 44pt 터치 영역, 접근성 이름, reduced motion 처리
- 로딩·빈 상태·오류·오프라인 읽기 전용의 기능적 의미

### 개선할 것

- `colors`와 `illustratedColors`가 나뉘어 같은 역할에 다른 색을 사용한다.
- `radii.sm`, `md`, `card`, `lg`, `sheet`, `scene`의 차이가 작아 역할이 불명확하다.
- 카드 대부분이 테두리, 배경, 그림자를 동시에 가져 화면이 조각나 보인다.
- 제목, 설명, caption의 크기 차이가 작아 핵심 정보가 바로 드러나지 않는다.
- 뒤로가기 버튼이 페이지 제목과 별도 행을 차지해 작은 화면에서 겹치거나 공간을 낭비한다.
- 구매·저장 결과가 일반 Panel로 추가되어 콘텐츠가 아래로 밀린다.
- 로딩 상태가 최종 레이아웃과 다른 한 줄 문구 또는 spinner로 표현된다.
- 하단 탭과 일부 아이콘이 기호 문자로 구성되어 시각적 무게와 플랫폼 표현이 다르다.
- 선택 색상과 주요 행동 색상이 화면마다 달라 현재 상태를 예측하기 어렵다.

현재 다이얼은 `DESIGN_VARIANCE 5 / MOTION 5 / VISUAL_DENSITY 6`으로 판단한다. 화면별
표현 차이가 크고 장식 요소가 많으며 정보 밀도에 비해 계층이 약하다.

## 4. 목표 디자인 읽기

디자인 읽기: 친구와 동물을 키우는 소비자용 생활 게임을 위한 모바일 중심 제품 UI.
토스식 명료함과 우리집의 봉제 인형·미니어처 장면을 결합한다.

목표 다이얼은 다음과 같다.

- `DESIGN_VARIANCE 4`: 정보 화면은 정렬과 반복 규칙을 강하게 적용한다. 방만 자유로운
  시각 무대로 남긴다.
- `MOTION_INTENSITY 3`: 자동 장식 애니메이션보다 터치, 저장, sheet 전환 피드백에 쓴다.
- `VISUAL_DENSITY 5`: 모바일에서 한 번에 핵심 행동과 필요한 설명이 함께 보이는 밀도다.

토스는 공식 React Native 디자인 시스템으로 가져오는 대상이 아니다. 우리집의 기존
React Native 공통 컴포넌트를 semantic token 기반으로 재구성한다.

## 5. 디자인 원칙

1. 한 화면의 첫 시선에는 제목, 현재 상태, 주요 행동만 둔다.
2. 주요 행동은 한 화면에 하나만 파란색으로 강조한다.
3. secondary 행동은 흰 표면 또는 투명 배경을 사용하며 primary와 경쟁하지 않는다.
4. 카드가 없어도 여백과 타이포그래피로 묶을 수 있으면 카드를 만들지 않는다.
5. 테두리는 입력, 선택, 구분이 필요한 곳에만 사용한다.
6. 그림자는 bottom sheet, modal, 떠 있는 action처럼 실제 고도가 있을 때만 사용한다.
7. 색은 행동과 의미를 표현한다. 동물 point color는 소유자 식별 외에 쓰지 않는다.
8. 문장은 사용자가 다음에 할 수 있는 일을 직접 설명한다.
9. 성공은 짧게 확인하고 화면을 밀지 않는다. 실패는 원인과 복구 행동을 같은 위치에 둔다.
10. 앱의 대표 시각은 UI 장식이 아니라 네 동물과 방이다.

## 6. Semantic token

### 6.1 색상

| token | 값 | 역할 |
| --- | --- | --- |
| `background` | `#F7F8FA` | 일반 페이지 배경 |
| `surface` | `#FFFFFF` | sheet, modal, 입력과 필요한 카드 |
| `surfaceSubtle` | `#F2F4F6` | 선택되지 않은 control, 보조 영역 |
| `textPrimary` | `#191F28` | 제목과 핵심 값 |
| `textSecondary` | `#4E5968` | 본문과 보조 설명 |
| `textTertiary` | `#8B95A1` | metadata와 비활성 설명 |
| `border` | `#E5E8EB` | 입력·구분선 |
| `brand` | `#3182F6` | primary action, focus, 현재 주 탐색 |
| `brandPressed` | `#1B64DA` | primary pressed |
| `brandSoft` | `#E8F3FF` | 선택 배경과 정보 안내 |
| `success` | `#20A464` | 저장·완료 상태 |
| `warning` | `#F59F00` | 주의와 복구 가능한 지연 |
| `danger` | `#E42939` | 삭제·탈퇴·차단 오류 |
| `scrim` | `rgba(25,31,40,0.46)` | modal과 sheet 배경 |

`white`, `cream`, `paper`, `ink`, `mutedInk`, `peach`, `mint`, `sky`처럼 재료나 색 이름을
직접 참조하는 기존 token은 semantic token으로 교체한다. 방 renderer는 별도 scene palette와
asset 색을 계속 사용할 수 있다.

사용자 point color는 이름표의 3px 선, 작은 avatar 배경, 소유자 표시에서만 사용한다.
접속 상태, 성공, 선택, primary action에는 사용하지 않는다.

### 6.2 타이포그래피

Pretendard Variable을 저장소에 포함해 iOS, Android, web의 한국어 폭과 무게를 통일한다.
Toss Product Sans를 복제하거나 배포하지 않는다. 글꼴을 불러오기 전에는 플랫폼 sans-serif를
fallback으로 사용하고 splash를 유지한다.

| variant | 크기/행간 | 무게 | 용도 |
| --- | --- | --- | --- |
| `display` | 32/40 | 700 | 인증·온보딩의 첫 제목 |
| `title` | 28/36 | 700 | 페이지 제목 |
| `sectionTitle` | 20/28 | 700 | 화면 내부 주요 구획 |
| `headline` | 17/24 | 600 | 카드·행 제목 |
| `body` | 16/24 | 400 | 기본 본문 |
| `bodyStrong` | 16/24 | 600 | 값과 선택된 문장 |
| `label` | 15/20 | 600 | 버튼·입력 label |
| `caption` | 13/18 | 400 | 날짜·metadata·도움말 |

제목은 왼쪽 정렬을 기본으로 한다. modal의 축하 결과와 출석 보상처럼 한 개의 결과에 집중하는
경우만 중앙 정렬한다. 숫자는 같은 variant 안에서 tabular number를 사용한다.

### 6.3 간격과 크기

- 기본 간격 scale: `4, 8, 12, 16, 20, 24, 32, 40, 48`
- compact 페이지 gutter: 20
- medium 페이지 gutter: 28
- wide 페이지 gutter: 32
- 정보 화면 최대 폭: 720
- 목록 화면 최대 폭: 1120
- 입력·일반 버튼 높이: 52
- 작은 action과 icon touch target: 최소 44
- 하단 primary action 영역: safe area 포함 최소 76

### 6.4 반경과 고도

- 입력과 일반 control: 14
- 카드와 inline notice: 20
- bottom sheet와 modal: 28
- chip과 badge: 999
- 방 scene: 24

기본 카드에는 그림자를 사용하지 않는다. sheet와 modal은 배경색에 맞춘 한 단계 그림자만
사용한다. web hover는 색 변화와 최대 1px 이동만 허용한다.

## 7. 공통 컴포넌트 계약

### `AppText`

새 semantic type variant와 text tone을 제공한다. 직접 `fontSize`, 임의 색상, 임의 굵기를
화면에 반복하지 않는다. 한 줄 제목은 큰 글자 설정에서 잘리지 않도록 필요한 경우 줄바꿈을
허용한다.

### `AppButton`

- `primary`: brand 배경, 흰 글자, 화면의 주 행동 한 개
- `secondary`: surfaceSubtle 배경, textPrimary
- `tertiary`: 투명 배경, brand 글자
- `danger`: dangerSoft 배경, danger 글자
- `icon`: 44×44, 접근성 이름 필수

`selected`는 버튼 tone과 분리한다. 선택 control은 `brandSoft + brand text + check/icon`을
사용한다. pressed는 opacity가 아니라 `scale 0.98` 또는 1px 이동으로 피드백한다.

### `AppPageHeader`

뒤로가기, 제목, 선택적 trailing action을 같은 행에 둔다. compact·medium에서는 44px
뒤로가기 자리를 예약해 제목과 겹치지 않게 한다. wide에서는 콘텐츠 열의 왼쪽에 제목을
정렬하고 history가 있는 상세 화면에만 뒤로가기를 둔다.

### `AppInput`

label은 입력 위, helper/error는 아래에 둔다. placeholder를 label로 사용하지 않는다.
기본·focus·error·disabled 상태를 token으로 통일하고 키보드와 제출 CTA가 겹치지 않게 한다.

### `AppSection`

제목과 선택적 action, 본문 간격을 표준화한다. 기본적으로 별도 카드 배경을 만들지 않는다.

### `ListRow`

설정, 멤버, 소유자, 알림 항목을 56~68px 행으로 표현한다. icon, title, description,
value, chevron의 역할을 고정한다. 목록 전체에 외곽 카드를 씌우지 않고 필요한 행 사이에만
구분선을 둔다.

### `BottomActionBar`

폼 저장, 입주, 구매 확인처럼 화면의 주 행동을 safe area 위에 고정한다. 스크롤 콘텐츠는
가려지지 않도록 같은 높이의 하단 여백을 가진다. keyboard가 열리면 입력과 CTA가 함께
보이도록 scroll 또는 keyboard avoiding을 적용한다.

### `AppSnackbar`와 `InlineNotice`

짧은 성공·정보 메시지는 snackbar로 표시해 레이아웃을 밀지 않는다. 사용자가 조치해야 하는
오류와 오프라인 상태는 관련 control 근처의 InlineNotice로 유지한다. private content나 token은
메시지에 포함하지 않는다.

### `Skeleton`

spinner와 로딩 문구 대신 최종 화면의 title, row, card, image 비율을 닮은 정적 skeleton을
제공한다. reduced motion에서는 shimmer를 사용하지 않는다.

## 8. 탐색과 앱 셸

- 주 탐색 이름과 route는 `우리집 / 꾸미기 / 추억`을 유지한다.
- compact·medium 하단 탭은 흰 표면, 1px 상단 구분선, icon+label로 구성한다.
- 활성 탭은 brand 아이콘과 label weight로 표시한다. 큰 배경 pill을 탭마다 만들지 않는다.
- wide는 80px 왼쪽 rail 대신 88px 이하의 조용한 rail을 유지하며 같은 icon family를 쓴다.
- 기호 문자 아이콘은 Expo Symbols 또는 현재 지원되는 한 icon family로 교체한다.
- 하단 탭, snackbar, bottom action, sheet의 z-index 순서를 공통 상수로 고정한다.

## 9. 화면별 정보 구조

### 9.1 로그인·가입

- display 제목, 한 줄 설명, 입력, primary CTA, 계정 전환 link 순서로 단순화한다.
- 이메일, Google, Kakao가 있다면 동일한 세로 폭을 쓰되 이메일 primary와 소셜 provider를
  시각적으로 분리한다.
- 오류는 해당 입력 아래에 표시하고 입력값은 유지한다.

### 9.2 온보딩과 친구 만들기

- 이름, 동물, point color를 한 번에 빽빽하게 놓지 않고 한 화면 안의 명확한 section으로
  구분한다.
- point color는 스포이드 아이콘, 실제 색 swatch, `이름표와 내 가구 표시 색` 설명을 함께 둔다.
- 마지막 `친구 만들기`를 유일한 primary CTA로 둔다.

### 9.3 집 선택·생성·초대 입주

- 새 집 만들기와 초대 입장을 동일 크기 카드 두 개로 경쟁시키지 않는다. `새 집 만들기`를
  primary로, `초대받았어요`를 secondary row로 표현한다.
- 초대 미리보기는 집 이름, 초대한 사람, 현재 `n/4`, 만료 상태만 보여준다.
- 만료, 정원 초과, 이미 집이 있음 상태는 제목과 복구 행동 하나로 정리한다.

### 9.4 우리집 홈

- 방은 계속 화면의 대표 요소다. neutral chrome을 사용해 방 이미지와 경쟁하지 않는다.
- 상단은 집 이름, `n/4`, coin, 설정만 표시한다. 멤버 avatar는 별도 한 줄에 둔다.
- 이름표는 동물 몸을 가리지 않도록 발 아래 safe zone에 고정한다. point color 선과 이름을 함께 쓴다.
- 동물의 상태 prompt는 한 줄 요약과 `보기` 행동만 제공한다.
- 동물 상세 sheet에서 상태, 소유자, 행동 세 개, 최근 버릇을 위계 순으로 표시한다.
- 행동 버튼은 현재 저장된 상태만 selected로 표시하고 mutation 중에는 행위 전체를 잠그지 않는다.

### 9.5 꾸미기와 보관함

- 방을 상단에 유지하고 선택한 슬롯만 약한 blue outline으로 표시한다.
- compact tray는 46~56% 높이, medium은 40~48%, wide는 우측 360~420px panel을 사용한다.
- `보관함 / 상점` segment는 sheet 상단에 두고 category chip은 그 아래 가로 scroll로 둔다.
- item card는 이미지, 이름, 소유자 또는 가격, 상태 action만 보여준다.
- 선택 후 `이 가구 놓기`가 bottom action의 유일한 primary가 된다.

### 9.6 상점

- 헤더에는 제목과 coin balance, 보관함 진입만 둔다.
- 서버 카탈로그 안내 문장은 기본 화면에서 제거하고 오류 또는 정보 sheet에서만 제공한다.
- 상품은 compact 2열을 기본으로 하되 360px 미만에서만 1열로 내린다. medium 3열, wide 4열이다.
- 카테고리는 sticky horizontal chip row로 유지한다.
- 구매는 상품 상세 sheet에서 확인한다. 코인 부족은 현재 금액, 필요한 금액, 부족 금액을 보여준다.
- 성공은 snackbar와 wallet query 갱신으로 표현한다.

### 9.7 추억

- 스크랩북 장식은 사진과 가구 이미지에만 남기고 페이지 chrome은 neutral UI를 쓴다.
- 현재 추억과 개인 보관함은 top segment로 분리해 한 화면에 긴 두 목록을 이어 붙이지 않는다.
- 월 구분은 section title로, 추억 card는 사진, 제목, 날짜, 참여자만 우선 표시한다.
- 새 기록은 헤더 trailing action 또는 빈 상태 primary로 한 곳에서만 강조한다.
- 상세는 기여 글과 사진을 시간순으로 보여주고 권한·퇴장 cutoff 안내는 InlineNotice로 둔다.

### 9.8 버릇

- 현재 학습을 상단의 하나의 progress summary로 보여준다. 장식 progress track 대신 `2/3일` 숫자와
  참여 날짜를 사용한다.
- 배우는 동물과 가르치는 동물을 좌우 한 쌍으로 표시하고 방향 icon으로 관계를 설명한다.
- 배운 버릇은 ListRow로 구성하고 출처 동물과 습득일을 보조 정보로 둔다.

### 9.9 설정과 집 관리

- 계정, 집, 알림, 앱 정보 section을 ListRow 묶음으로 구성한다.
- 로그아웃, 집 나가기, 계정 삭제는 서로 다른 위험 수준을 설명하고 별도 확인 sheet를 사용한다.
- 집 나가기 뒤 유지되는 동물·코인·아이템·버릇과 제한되는 추억 접근을 확인 sheet에 요약한다.

## 10. 반응형 계약

기존 구간을 유지한다.

| 구간 | 너비 | 기본 구조 |
| --- | --- | --- |
| compact | 0~599 | 20px gutter, 하단 탭, 한 열, bottom sheet |
| medium | 600~899 | 28px gutter, 하단 탭, 2~3열 목록, 넓은 sheet |
| wide | 900 이상 | 32px gutter, 왼쪽 rail, 최대 폭 콘텐츠, 우측 보조 panel |

방 scene 안의 동물·가구는 배경과 같은 contain scale과 offset을 사용한다. viewport가 줄어들 때
각 sprite를 독립 pixel 좌표로 이동하지 않는다. scene 논리 좌표를 한 번 변환해 모든 layer에
적용한다.

320px, 390px, 600px, 768px, 900px, 1280px에서 다음을 확인한다.

- 제목과 뒤로가기의 비겹침
- CTA label 한 줄 유지와 최소 44pt
- 하단 탭, bottom action, keyboard의 비겹침
- 방 이름표와 네 동물 touch target 비겹침
- category chip의 가로 scroll과 상품 열 수
- 긴 한국어와 200% 글자 확대에서 잘림 없음

## 11. 상태·오류·피드백

- 로딩: 최종 레이아웃 형태의 skeleton
- 빈 상태: 제목, 이유 또는 기대 결과, 한 개의 다음 행동
- 오류: 발생 위치 가까이 원인과 재시도 표시
- 오프라인: 마지막 읽기 화면 유지, 확정 action 비활성, 상단 InlineNotice 한 개
- 성공: 2~3초 snackbar, 필요한 query 갱신
- 결과 불확실: 구매·입주의 결과 조회 중 상태를 유지하고 즉시 실패로 표시하지 않음
- 권한 상실: notification 또는 deep link 대상 대신 현재 접근 가능한 화면과 설명으로 이동

## 12. 접근성·모션

- 본문과 배경은 WCAG AA 4.5:1, 큰 텍스트와 icon은 최소 3:1을 만족한다.
- 색만으로 선택, 소유자, 성공, 오류를 구분하지 않는다.
- 모든 icon-only button은 한국어 accessibilityLabel을 가진다.
- sheet와 modal은 dialog semantics, 닫기 action, focus 복귀를 제공한다.
- 동물 터치와 동일한 행동을 일반 버튼으로도 실행할 수 있다.
- pressed, sheet open, snackbar enter는 transform과 opacity만 사용한다.
- 반복 idle animation은 앱 background와 reduced motion에서 멈춘다.
- reduced motion에서는 shimmer, bounce, scale celebration을 정적 변화로 대체한다.

## 13. 구현 단계

1. Foundation: semantic token, Pretendard, AppText, AppButton, AppInput, AppPageHeader,
   AppSection, ListRow, Snackbar, Skeleton
2. Forms: 로그인, 가입, 온보딩, 집 선택·생성·입주
3. House shell: 상단 chrome, 멤버 행, 하단 탭, 동물 sheet, 출석과 초대 overlay
4. Commerce: 상점, 상품 상세, 보관함, 꾸미기 tray, 구매 피드백
5. Memories and habits: 추억 목록·상세·작성, 완성 modal, 버릇 학습
6. Settings and states: 설정, 집 관리, 위험 action, 공통 loading·empty·error·offline
7. Responsive QA: web viewport matrix, keyboard, large text, reduced motion, iOS·Android 실제 기기

각 단계는 독립 Issue, 한 commit, PR로 완료한다. 공통 컴포넌트가 준비되기 전에 화면별 임의
색상과 spacing을 추가하지 않는다. 기존 route·repository·analytics 의미를 유지한다.

## 14. 테스트와 완료 기준

### 자동화

- token에 금지된 legacy UI 색 직접 사용이 남지 않는지 검사
- AppButton tone, disabled, selected, pressed, accessibility state
- AppPageHeader의 compact·medium·wide 배치
- AppInput의 label·helper·error와 keyboard submit
- Snackbar queue와 reduced motion
- 주요 화면의 primary CTA 한 개와 empty/error/offline 행동
- breakpoint별 grid 열과 scene transform
- 기존 Jest 전체, typecheck, lint, web export

### 시각 검증

- web: 320×568, 390×844, 768×1024, 1280×800
- light theme 전체 화면
- keyboard only navigation과 visible focus
- 200% 글자 확대, reduced motion
- 방 이름표·가구·동물 배경 정렬
- 상점 40종, 추억 가구 15종 이미지 로드와 카드 비율

### 실제 환경

- iOS와 Android Development Build에서 safe area, keyboard, bottom sheet, back gesture
- 실제 Supabase 계정에서 인증, 입주, 구매, 배치, 추억 작성, 탈퇴 흐름
- 실제 확인하지 않은 native·screen reader 결과는 web 결과와 분리해 기록

## 15. 제외 범위

- 게임 규칙, DB migration, RPC, RLS, Storage 정책 변경
- 동물·가구 이미지 재생성
- 유료 결제와 관리자 강제 퇴장
- route slug와 주 탐색 이름 변경
- 토스 로고, 전용 서체, icon, 문구 또는 화면의 복제
- 전체 dark mode 도입. 첫 구현은 방 에셋과 브랜드 방향에 맞춘 light theme로 고정하고,
  semantic token이 향후 dark theme를 수용할 수 있게 한다.
