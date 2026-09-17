# 스키마 제약·인덱스 정리

- 상태: 완료
- 브랜치: `feat/schema-constraints-indexes`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

요구사항에서 전제하지만 DB가 보장하지 않던 제약을 스키마로 강제하고, 리뷰 목록 조회용 인덱스를 둔다.

- 단계 수마다 루틴 템플릿은 하나 (`RoutineTemplate.stepCount` unique)
- 한 템플릿 안에서 단계 순서는 겹치지 않음 (`RoutineTemplateStep` `(templateId, order)` unique)
- 제품별 리뷰 목록 조회·최신순 정렬용 `Review` `(productId, createdAt)` 인덱스

## 배경

요구사항과 스키마를 맞추는 작업의 다섯 번째(마지막 스키마 정리). 요구사항 §4.3은 단계 구성이 고정이라고 하지만
중복 템플릿·중복 순서를 막는 제약이 없어 시드의 `findFirst`로만 피하고 있었다.
리뷰 목록(FR-REV-12·13·17)은 제품별로 조회하는데, `Review`의 기존 unique `(userId, productId)`는 `userId`가 선두라 쓸 수 없었다.

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | 위 unique 2개, 인덱스 1개 |
| `apps/api/prisma/migrations/<시각>_schema_constraints_indexes/` | 인덱스 3개 생성 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |

## 하위 작업

- [x] 로컬 DB에 기존 중복 없음 확인 (템플릿 `stepCount`, `(templateId, order)` 모두 0건)
- [x] 스키마 수정, 마이그레이션 생성·적용, SQL 확인 (인덱스 생성만, 데이터 변경 없음), DB와 스키마 차이 없음 확인
- [x] 시드 재실행 정상
- [x] 로컬 DB 트랜잭션에서 같은 `stepCount` 템플릿, 같은 템플릿의 같은 `order` 거부 / 다른 템플릿의 같은 `order` 허용 확인 후 롤백
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 리뷰 인덱스는 `(productId, createdAt)` 하나만 둠. 이유: 제품별 조회 + 최신순 정렬 + 추천순 동점 시 최신순(FR-REV-13)을 함께 커버.
  피부타입 필터(FR-REV-16)나 추천 수 정렬은 실제 쿼리가 생긴 뒤 필요할 때 추가.
- **2026-09-17** — 시드의 `findFirst`·`updateMany`는 그대로 둠. 이유: unique가 생겨도 동작이 같고, 기존 단계 갱신 시 카테고리 일치 조건을 유지하려면 `updateMany`가 필요함.
- **2026-09-17** — 마이그레이션을 #41과 같이 `prisma migrate diff --from-config-datasource --to-schema --script`로 생성함.
  이유: unique 추가 경고 확인 입력 때문에 `migrate dev`가 비대화형 환경에서 중단됨. 적용 후 `migrate diff --exit-code` 0 확인.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: api 테스트 DB 전략 미결([testing.md](../../testing.md)).

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
pnpm --filter api exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
pnpm --filter api exec prisma db seed
```

## 미결 / 후속

- `migrate dev`가 비대화형에서 막혀 `migrate diff`로 우회한 게 두 번째 — 피드백 승격 규칙에 따라 `apps/api/AGENTS.md` "스키마 변경"에 절차 추가 검토
- 스키마에 맞춘 `@stin/types` 일괄 정리
