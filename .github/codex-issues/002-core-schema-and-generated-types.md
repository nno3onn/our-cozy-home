# [Backend Foundation] 핵심 스키마와 생성 Database 타입 도입

## 목적

사용자·집·멤버십·동물 및 공통 설정의 영속 모델을 migration으로 만들고 실제 생성 타입을 앱 경계에 제공한다.

## 배경 / 현재 상태

도메인 타입과 빈 `database.generated.ts`만 있고 DB 테이블이나 생성 절차는 없다. 정원 4명과 사용자당 활성 집 하나는 문서에만 정의되어 있다.

## 선행 작업

001-supabase-local-environment.md

## 구현 범위

- `app_settings`, `profiles`, `houses`, `house_memberships`, `animals` 테이블·enum·인덱스를 migration으로 추가한다.
- UUID, timestamp, 상태, 참조 무결성과 활성 멤버십 부분 고유 인덱스를 정의한다.
- `house_capacity=4`, KST 출석 보상 100 등 공통 설정 seed를 추가한다.
- Supabase CLI로 `src/types/database.generated.ts`를 생성하고 재생성 명령을 제공한다.

## 상세 요구사항

- 집은 `active|archived`, 멤버십은 `active|left`, 역할은 `admin|member`를 명시한다.
- 같은 동물 종류를 여러 사용자가 선택할 수 있으며 동물은 사용자 소유다.
- 사용자당 활성 멤버십은 최대 하나지만 과거 멤버십 이력은 유지한다.
- 집 정원은 설정에서 관리하며 단순 check constraint만으로 동시 입주를 해결하지 않는다.

## 보안 / 권한

이 단계에서는 기본 RLS를 활성화하고 명시적 정책 전까지 public 역할의 직접 변경을 막는다. 세부 정책은 010에서 완성한다.

## 동시성 / 멱등성

활성 멤버십 부분 고유 인덱스가 경쟁 요청의 최종 방어선이어야 한다. seed와 타입 생성은 반복 가능해야 한다.

## 제외 범위

집 생성·초대·탈퇴 RPC와 화면은 구현하지 않는다.

## 테스트

- 자동화: FK/check/부분 고유 인덱스, 설정 seed 값, 같은 사용자의 두 활성 멤버십 거부를 SQL로 검증한다.
- 실제 환경: 로컬 Supabase reset 후 타입 생성 diff와 TypeScript 컴파일을 확인한다.

## 완료 조건

- [ ] 핵심 테이블과 제약이 migration으로 재현된다.
- [ ] 활성 집 하나 제약이 DB에서 강제된다.
- [ ] 정원 4와 출석 100 설정이 seed된다.
- [ ] 생성 타입이 실제 스키마와 일치하고 typecheck가 통과한다.

## Codex 작업 지침

- 작업 전 관련 코드를 읽는다.
- product-spec/architecture/progress와 충돌하지 않는다.
- Issue 범위 밖의 후속 기능을 임의로 구현하지 않는다.
- Demo Mode를 유지해야 하는 단계에서는 기존 Demo Mode를 깨뜨리지 않는다.
- 구현 후 typecheck/lint/관련 tests를 실행한다.
- 실제 검증하지 않은 것을 완료했다고 주장하지 않는다.
- PR 본문에 변경사항과 검증 결과를 기록한다.
