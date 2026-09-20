# [Memories] 기여 Revision과 탈퇴 시점 열람 범위 구현

## 목적

“함께 볼 수 있는 사람”과 “직접 기여한 사람”을 분리하고 탈퇴자의 개인 보관함을 원본 연결+시점 제한으로 구현한다.

## 배경 / 현재 상태

viewer snapshot 기반은 있지만 글 기여, revision, 사진 metadata와 퇴장 시 `access_ended_at` 규칙이 없다.

## 선행 작업

017-memory-drafts-and-sharing.md

## 구현 범위

- `memory_contributions`, `memory_contribution_revisions`, 사진 metadata의 접근 시점 필드를 추가한다.
- 기여 추가·수정·삭제 RPC와 상세 조회 view/RPC를 구현한다.
- 집 탈퇴 트랜잭션에 직접 기여 여부에 따른 `archive_retained`, `access_ended_at` 처리를 연결한다.
- 개인 보관함 조회와 현재 집 추억 조회를 분리한다.

## 상세 요구사항

- 반복 수정은 한 명의 기여로만 센다.
- 떠난 사람은 직접 참여한 추억만 퇴장 시점까지 공개된 revision/사진을 본다.
- 퇴장 후 다른 사용자가 추가·수정한 내용은 보거나 수정할 수 없다.
- 원작자 삭제는 시점보다 우선해 떠난 사람 보관함에서도 즉시 숨긴다.
- 재입주해도 이전 grant나 부재중 내용을 자동 복원하지 않는다.
- 사진/글을 보관함용으로 영구 복제하지 않는다.

## 보안 / 권한

viewer grant, 직접 기여, membership 및 access cutoff를 RLS/조회 함수에서 모두 검사한다. 작성자만 자기 원본을 수정·삭제한다.

## 동시성 / 멱등성

revision 추가와 contribution 존재 확인을 원자적으로 처리한다. 탈퇴 시각과 동시 수정은 집/멤버십 잠금 기준으로 명확한 전후 결과를 만든다.

## 제외 범위

실제 Storage 객체 업로드/삭제와 가구 생성은 제외한다.

## 테스트

- 자동화: viewer/기여자 구분, 퇴장 전후 revision, 원작자 삭제, 단순 viewer 탈퇴, 재입주 권한 미복원을 검증한다.
- 실제 환경: A/B 계정으로 B 탈퇴 전후 A 수정과 B 보관함 결과를 확인한다.

## 완료 조건

- [ ] 직접 기여자만 개인 보관함 유지 권한을 얻는다.
- [ ] 퇴장 시점 이후 내용이 차단된다.
- [ ] 원작자 삭제가 모든 보관함에 반영된다.
- [ ] 재입주가 과거 권한을 되살리지 않는다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
