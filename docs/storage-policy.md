# 추억 사진 Storage 정책

`memory-photos`는 private bucket이다. public URL을 만들지 않으며, 열람은
`storage.objects`의 RLS를 통과한 뒤에만 짧은 만료의 signed URL을 만들 수 있다.

- 객체 key는 서버가 만든 무작위 photo UUID를 사용한다. contribution UUID는 DB에서
  직접 열람할 수 없고, user ID·초대 토큰·집 이름을 경로에 넣지 않는다.
- 버킷 생성 migration은 기본 거부로 시작한다. photo lifecycle migration은 prepared
  metadata의 작성자 insert, 현재 viewer 또는 archive cutoff viewer의 read, 작성자
  delete만 허용한다. 따라서 권한이 없는 사용자는 object 목록·다운로드·삭제를 모두
  수행할 수 없다.
- `prepare_memory_photo_upload`와 `complete_memory_photo_upload`는 사진 metadata를
  먼저 만들고 업로드 완료를 표시한다. object upload 실패 시 prepared 행을 재시도 또는
  정리할 수 있으며, 원본 삭제는 metadata와 object를 함께 삭제하는 다음 lifecycle
  명령의 책임이다.
- 클라이언트의 signed URL 생성은 `storage.objects` SELECT RLS를 다시 적용받는다.
  service-role key를 사용하는 우회 URL 발급은 앱에서 하지 않는다.
- 앱 로그·오류 보고에는 object key 전체나 signed URL을 기록하지 않는다.
