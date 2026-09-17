# 저장 루틴 삭제 시 단계 함께 삭제

- 상태: 진행 중
- 브랜치: `fix/routine-step-cascade`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

`Routine`을 삭제하면 딸린 `RoutineStep`이 DB에서 함께 삭제된다.
외래키 제약 때문에 루틴 삭제가 실패하지 않는다.

## 배경

FR-SAV-04(저장된 루틴 삭제)가 필수 요구사항인데, `RoutineStep.routine` 관계가
기본값 `ON DELETE RESTRICT`라 단계가 남아 있는 루틴은 삭제할 수 없었다.
단계는 루틴 없이 의미가 없는 스냅샷이라 함께 지우는 것이 맞다.

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | `RoutineStep.routine`에 `onDelete: Cascade` |
| `apps/api/prisma/migrations/<시각>_routine_step_cascade_delete/` | 외래키 재생성 마이그레이션 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 (해시만 바뀜) |

## 하위 작업

- [x] 스키마 수정
- [x] `prisma migrate dev`로 마이그레이션 생성, SQL 확인 (FK 재생성만, 데이터 영향 없음)
- [x] 로컬 DB에서 루틴 삭제 시 단계 삭제·제품 유지 확인 (트랜잭션 후 롤백)
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 앱 코드에서 단계를 먼저 지우는 대신 DB `onDelete: Cascade`로 처리함.
  이유: 삭제 경로가 늘어나도 누락될 수 없음. `RoutineStep`은 루틴 소속 스냅샷이라 단독 존재 가치가 없음.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: `apps/api` 테스트의 DB 전략(테스트 컨테이너/목)이
  미결([testing.md](../../testing.md) 미결)이라 FK 동작을 검증할 자리가 없음. 루틴 삭제 API 구현 시 E2E로 보강.

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
```

로컬 DB에서 트랜잭션으로 `Routine` + `RoutineStep` 2건을 넣고 `Routine`을 삭제 →
`RoutineStep` 0건, `Product`는 유지되는지 확인 후 롤백.

## 미결 / 후속

- 루틴 삭제 API 구현 시 소유권 검증(NFR-04)과 E2E 테스트
- `RoutineTemplateStep.template`, `Review`→`ReviewRecommendation`(§10-3)의 삭제 정책은 이 작업 범위 밖
