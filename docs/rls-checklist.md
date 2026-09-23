# RLS 정책 체크리스트

새 테이블을 추가할 때 반드시 RLS를 켜고, `anon`, `authenticated`, `service_role`의 읽기·쓰기 범위를 명시한다.

- 집 공유 조회는 현재 `house_memberships.status = 'active'`만 권한 근거로 쓴다.
- wallet, ownership, role, membership, invite acceptance는 client 직접 쓰기를 허용하지 않고 RPC만 사용한다.
- 개인 행은 `auth.uid()`와 소유자 열을 비교한다. client 제공 ID는 권한 근거가 아니다.
- `security definer` RPC는 `auth.uid()` 검증, 고정 `search_path`, `revoke all` 뒤 최소 `grant execute`를 갖는다.
- 탈퇴·archive 뒤에도 과거 membership만으로 집 행·동물·프로필을 읽을 수 없어야 한다.
- 추억 viewer 및 Storage object 정책은 별도 추억 migration에서 이 규칙에 더해 적용한다.
