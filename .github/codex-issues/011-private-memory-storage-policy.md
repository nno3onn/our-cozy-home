# [Security] 비공개 추억 사진 버킷과 Storage 권한 기반 구축

## 목적

추억 사진을 public URL 없이 저장하고 DB 접근 권한과 일치하는 Storage 정책의 기반을 만든다.

## 배경 / 현재 상태

사진 UI와 Storage bucket이 없다. 상세 memory viewer/퇴장 시점 정책은 후속 migration에서 결합될 예정이다.

## 선행 작업

010-database-rls-and-rpc-hardening.md

## 구현 범위

- private `memory-photos` bucket을 migration으로 생성한다.
- 예측 불가능한 객체 경로 규칙과 업로더 소유 메타데이터를 정의한다.
- signed URL 발급을 위한 서버 함수 경계와 기본 deny 정책을 만든다.
- 향후 `memory_viewers`와 결합할 정책 helper 계약을 문서화한다.

## 상세 요구사항

- public bucket과 영구 공개 URL을 사용하지 않는다.
- 원본 사용자 ID/초대 토큰을 노출하는 추측 가능한 단독 경로를 피한다.
- 앱 로그와 오류에는 전체 객체 경로 또는 서명 URL을 남기지 않는다.
- DB 권한이 없는 사용자는 object 목록 조회도 할 수 없어야 한다.

## 보안 / 권한

업로드·다운로드·삭제는 인증 사용자와 DB grant를 모두 확인한다. service role 비밀은 Edge/서버 환경에만 둔다.

## 동시성 / 멱등성

객체 key는 재시도 충돌을 피할 고유 ID를 사용한다. DB commit과 object 정리 사이 실패를 후속 photo lifecycle이 복구할 수 있게 상태를 둔다.

## 제외 범위

이미지 선택·압축·실제 memory viewer 정책과 삭제 복구는 020에서 구현한다.

## 테스트

- 자동화: anon/타 사용자 list·read·write·delete 거부와 허용된 업로더 경계를 Storage 통합 테스트로 검증한다.
- 실제 환경: 로컬 Storage API에서 private object와 짧은 signed URL 동작을 확인한다.

## 완료 조건

- [ ] 버킷이 migration으로 재현된다.
- [ ] 공개 URL과 무권한 목록 조회가 차단된다.
- [ ] DB 권한 결합 지점과 안전한 경로 규칙이 문서화된다.
- [ ] 테스트에서 다른 사용자의 객체 접근이 거부된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
