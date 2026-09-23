# 추억 사진 Storage 정책

`memory-photos`는 private bucket이다. 공개 URL을 만들지 않고, 앱은 권한 확인이 끝난
뒤 짧은 만료의 signed URL만 받는다.

- 객체 key는 서버가 만든 무작위 photo UUID를 사용하며, user ID·초대 토큰·집 이름을
  경로에 포함하지 않는다.
- 현재 migration은 `storage.objects`에 허용 정책을 두지 않아 모든 client object
  read/list/write/delete를 기본 거부한다.
- 추억 photo lifecycle migration은 DB의 memory viewer grant와 퇴장 시점 접근 범위를
  확인한 RPC를 통해 업로드·서명 URL·삭제를 추가한다.
- 앱 로그·오류 보고에는 object key 전체나 signed URL을 기록하지 않는다.
