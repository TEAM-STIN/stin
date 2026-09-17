# 탈퇴 익명화 스키마

- 상태: 완료
- 브랜치: `feat/user-withdrawal-anonymize`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

탈퇴한 사용자를 행 삭제 없이 익명화할 수 있는 스키마가 된다. `User.deletedAt`이 있고, `providerId`를 비울 수 있으며,
탈퇴자 여러 명이 `(provider, providerId)` unique에 걸리지 않는다. 같은 카카오 계정으로 재가입하면 새 사용자가 된다.
요구사항 FR-AUTH-09가 `[구현됨]`이 되고 탈퇴 처리 절차가 문서에 남는다.

## 배경

요구사항과 스키마를 맞추는 작업의 네 번째. 2026-09-17 결정(§10-2): 계정 행 유지 + 개인정보 삭제, 저장 루틴 삭제,
리뷰·리뷰 추천 유지. #41에서 소셜 로그인 구조만 반영하고 탈퇴는 분리했다.
결정 배경은 [architecture.md](../../architecture.md) "왜 탈퇴한 사용자를 삭제하지 않고 익명화하는가".

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | `User.deletedAt` 추가, `providerId` nullable, 탈퇴 절차 주석 |
| `apps/api/prisma/migrations/<시각>_user_withdrawal_anonymize/` | 컬럼 추가·NOT NULL 해제 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |
| `docs/requirements.md` | FR-AUTH-09 `[구현됨]`, §10-2 탈퇴 처리 절차 표 |
| `docs/architecture.md` | 삭제 대신 익명화한 이유 |

## 하위 작업

- [x] 스키마 수정, `prisma migrate dev`로 마이그레이션 생성·적용, SQL 확인 (컬럼 추가·NOT NULL 해제만, 데이터 영향 없음)
- [x] 로컬 DB 트랜잭션에서 탈퇴 절차 재현 후 롤백
  - 탈퇴자 2명 `providerId` null 공존 가능
  - 같은 카카오 계정 ID로 재가입 시 새 행 생성
  - 리뷰·추천 유지, 저장 루틴·단계 삭제
  - 활성 사용자끼리 `(provider, providerId)` 중복은 계속 거부
- [x] 요구사항·아키텍처 문서 갱신
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — `Routine.user`에 `onDelete: Cascade`를 추가하지 않음. 이유: 사용자 행을 지우지 않으므로 발동하지 않음.
  루틴 삭제는 탈퇴 트랜잭션에서 명시적으로 수행.
- **2026-09-17** — `provider`는 탈퇴 후에도 유지. 이유: 개인정보가 아니고 NOT NULL을 유지하는 편이 단순함.
- **2026-09-17** — 익명화 대상 필드 목록은 스키마 주석과 요구사항 §10-2 표에 둠. 이유: 탈퇴 API가 아직 없어 코드로 강제할 곳이 없음.
  탈퇴 API 구현 시 이 목록을 기준으로 테스트를 작성.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: api 테스트 DB 전략 미결([testing.md](../../testing.md)).

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
```

로컬 DB 트랜잭션에서 사용자·리뷰·추천·루틴을 만들고 요구사항 §10-2 절차대로 탈퇴 처리 →
위 하위 작업의 네 가지를 확인 후 롤백.

## 미결 / 후속

- 탈퇴 API(한 트랜잭션), 절차 필드 목록 기준 테스트
- 로그인 조회 시 `deletedAt` 필터 여부 — `providerId`가 비어 로그인 경로로는 찾을 수 없지만, 다른 조회(마이페이지 등)의 기준은 API 구현 시 결정
- 리뷰 목록에서 탈퇴자 닉네임 표시 방식 확인(현재 `탈퇴한 사용자` 저장값을 그대로 사용)
