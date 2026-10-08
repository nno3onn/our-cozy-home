# Foundation semantic token 마무리 계획

## 목표

방 에셋의 따뜻한 시각은 유지하면서 꾸미기 패널, 동물 상세, 빈 상태와 앱 chrome에 남은 구형 typography·색상 alias를 의미 기반 Foundation 규칙으로 통일한다.

## 구현 순서

1. 꾸미기 보관함과 동물 상세의 제목을 접근 가능한 header로 고정하는 테스트를 추가한다.
2. `heading`·`muted` 표현을 `sectionTitle`과 secondary/tertiary 정보 계층으로 교체한다.
3. 사용자 화면 chrome의 cream/paper/ink/line 등 호환 색상 alias를 semantic token으로 교체한다.
4. 방 배경·에셋·개인 point color가 변경되지 않았는지 관련 테스트와 전체 회귀 검사로 확인한다.

## 제외 범위

- 방 배경, 동물, 가구 이미지 자체의 색상·좌표 변경
- 카탈로그·서버 규칙·RPC 변경
- 호환 alias 정의 제거. 아직 테스트와 점진 전환을 위해 정의는 유지한다.
