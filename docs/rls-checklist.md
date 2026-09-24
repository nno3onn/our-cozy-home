# RLS 정책 체크리스트

새 테이블을 추가할 때 반드시 RLS를 켜고, `anon`, `authenticated`, `service_role`의 읽기·쓰기 범위를 명시한다.

- 집 공유 조회는 현재 `house_memberships.status = 'active'`만 권한 근거로 쓴다.
- wallet, ownership, role, membership, invite acceptance는 client 직접 쓰기를 허용하지 않고 RPC만 사용한다.
- 개인 행은 `auth.uid()`와 소유자 열을 비교한다. client 제공 ID는 권한 근거가 아니다.
- `security definer` RPC는 `auth.uid()` 검증, 고정 `search_path`, `revoke all` 뒤 최소 `grant execute`를 갖는다.
- 탈퇴·archive 뒤에도 과거 membership만으로 집 행·동물·프로필을 읽을 수 없어야 한다.
- 추억 viewer 및 Storage object 정책은 별도 추억 migration에서 이 규칙에 더해 적용한다.

## 현재 테이블 권한 매트릭스

| 영역 | anon | authenticated 직접 조회 | authenticated 직접 변경 | service role |
| --- | --- | --- | --- | --- |
| profiles·animals | 거부 | 본인, 현재 같은 집 구성원 | 본인 행만 제한적으로 수정 | 관리 작업 |
| houses·house_memberships | 거부 | 현재 active 멤버십인 집 | 거부, RPC만 | 관리 작업 |
| house_invites·acceptance history | preview RPC 외 거부 | 직접 조회·변경 거부, admin RPC만 | 거부 | 관리 작업 |
| wallet·transaction·owned_items·purchase requests | 거부 | 본인 소유 행만 | 거부, 출석/구매 RPC만 | 관리 작업 |
| catalog·room slots | 거부 | active catalog와 slot | 거부 | seed/관리 작업 |
| room placements | 거부 | active 집 멤버이며 추억 viewer 조건 충족 | 거부, placement RPC만 | 관리 작업 |
| memories·viewer·contributions·photos | 거부 | author 또는 현재 viewer, archive cutoff는 RPC | 거부, 추억 RPC만 | 관리 작업 |
| habit tables·push tokens·notification outbox | 거부 | 직접 조회·변경 거부, 필요한 RPC만 | 거부 | worker/관리 작업 |

`service_role`은 RLS를 우회하므로 Edge Function과 운영 도구에만 둔다. 앱 번들에는
publishable key만 포함하고 service-role key를 저장하거나 로그에 남기지 않는다.

## 적용 전 점검

- 새 RPC는 `security definer`, `set search_path=public`, `auth.uid()` 검사, `revoke all
  from public`와 최소 역할 `grant execute`를 모두 갖는지 확인한다.
- 새 table은 RLS enable 뒤 허용 SELECT policy 또는 명시적인 direct-access revoke를
  추가하고, owner/house/viewer 중 어떤 행 근거를 쓰는지 migration 주석에 쓴다.
- 새 집 멤버/탈퇴 migration은 active membership만 권한 근거로 쓰는지와 leave 직후
  기존 집 query가 0행이 되는지 SQL 다계정 test에 추가한다.
