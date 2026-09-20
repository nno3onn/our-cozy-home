# [Memories] 추억 이미지 압축·업로드·서명 URL·삭제 복구

## 목적

모바일/웹에서 안전하게 이미지를 준비해 비공개 Storage에 올리고 권한 기반으로 조회·삭제하며 실패 후 작성 상태를 복구한다.

## 배경 / 현재 상태

private bucket 기반은 있지만 앱 이미지 선택/압축, DB metadata와 viewer 연동, 실제 object 삭제 흐름이 없다.

## 선행 작업

011-private-memory-storage-policy.md, 018-memory-contributions-and-access-snapshots.md

## 구현 범위

- 이미지 선택·검증·압축 service와 `memory_photos` metadata 흐름을 구현한다.
- upload prepare/complete, 짧은 signed URL, delete RPC/Storage cleanup을 연결한다.
- 업로드 실패 시 글과 선택한 로컬 이미지 상태를 유지하고 재시도 UI를 제공한다.
- orphan object/metadata 정리 가능한 상태와 운영 절차를 추가한다.

## 상세 요구사항

- JPEG/PNG/HEIC/HEIF 원본 10MB 이하, 긴 변 2048px, JPEG 0.82, 결과 5MB 이하를 적용한다.
- EXIF 위치와 원본 형식 metadata를 업로드 객체에 보존하지 않는다.
- 후입주자와 access cutoff 이후 사진은 signed URL을 받지 못한다.
- 원작자 삭제 시 object와 metadata가 삭제 처리되고 보관함에서도 접근 불가다.
- 웹과 네이티브 선택기 차이를 adapter로 격리한다.

## 보안 / 권한

signed URL 발급 직전에 viewer/기여/archive cutoff를 재검사한다. 전체 경로·URL·토큰을 로그에 남기지 않는다.

## 동시성 / 멱등성

동일 upload request 재시도는 중복 contribution/photo를 만들지 않는다. DB 성공/Storage 실패와 반대 경우를 복구 가능하게 한다.

## 제외 범위

영상, 원본 장기 보관, 사진 편집기는 제외한다.

## 테스트

- 자동화: 형식/크기/압축, 실패 상태 보존, viewer/cutoff/delete 권한, orphan 상태를 검증한다.
- 실제 환경: 브라우저와 Development Build에서 선택·압축·업로드·삭제를 각각 확인한다.

## 완료 조건

- [ ] 제한에 맞는 이미지가 private bucket에 저장된다.
- [ ] 권한 없는/후입주/퇴장 이후 사용자는 URL을 받지 못한다.
- [ ] 실패 후 글을 잃지 않고 재시도한다.
- [ ] 원작자 삭제가 Storage와 모든 열람 경로에 반영된다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
