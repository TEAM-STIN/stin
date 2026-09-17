# 성분 그룹 아침/저녁 배치 기준

- 상태: 진행 중
- 브랜치: `feat/ingredient-time-of-day`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

`IngredientGroup`에 권장 시간대와 그 사유가 저장되고, 시드된 11개 그룹에 값이 채워진다.
요구사항 §10-1이 `[구현됨]`, FR-REC-07이 결정된 규칙(강제 배치)으로 바뀌고, 그룹별 근거가 성분 문서에 남는다.

## 배경

FR-REC-07(아침 루틴의 자극성·광과민성 성분 최소화)을 지키려면 "이 그룹은 저녁에"라는 정보가 필요한데
스키마에 자리가 없었다(§10-1). 2026-09-17 결정:

- 방식: A안 + 사유 — `preferredTimeOfDay TimeOfDay?` + `timeOfDayReason String?`
  (요구사항 초안의 B안 Boolean 2개는 "자극성이지만 아침 권장"인 고농도 비타민C를 표현 못 함)
- 값: 레티노이드류·AHA류·BHA류 = 저녁, 고농도 비타민C = 아침, PHA류와 나머지 = 상관없음
- 엔진 규칙: **강제**. 시간대가 정해진 그룹을 포함한 제품은 반대 시간대 루틴에 넣지 않음

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | `IngredientGroup.preferredTimeOfDay`, `timeOfDayReason` |
| `apps/api/prisma/migrations/<시각>_ingredient_group_time_of_day/` | 컬럼 2개 추가 |
| `apps/api/prisma/seed.ts` | 그룹별 시간대·사유, 기존 그룹도 갱신. 병용 규칙 `description` 8건·고민 매핑 `description` 41건 말투 변경 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |
| `docs/functional-ingredients.md` | 그룹 표에 시간대 열, 시간대 근거 절 |
| `docs/requirements.md` | FR-REC-07 규칙 갱신, §10-1 확정 |
| `docs/architecture.md` | A안 + 사유를 고른 이유, 강제 규칙 |

## 하위 작업

- [x] 스키마 수정, 마이그레이션 생성·적용, SQL 확인
- [x] 시드 수정, 재실행 후 DB 값 확인
- [x] 성분·요구사항·아키텍처 문서 갱신
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 사유는 enum이 아니라 문장(`String?`)으로 둠. 이유: `IngredientGroupConcern.description`·`IngredientRule.description`처럼
  근거 문장 생성(FR-RSN-02)에 그대로 쓰는 기존 방식과 맞춤.
- **2026-09-17** — 강제 규칙은 양방향. 저녁 그룹은 아침 루틴 불가, 아침 그룹(고농도 비타민C)은 저녁 루틴 불가.
  이유: "강제"로 결정했고, 한 방향만 강제하면 비타민C만 예외 규칙이 생김.
- **2026-09-17** — 성분 문서의 그룹별 근거 수준(ESTABLISHED/COMMON_BELIEF)은 작성 시 판단으로 붙임. 성분 근거 검토 때 확인 필요.
- **2026-09-17** — `migrate dev` 후 시드가 `PrismaClientValidationError`로 실패해 `prisma generate`를 따로 실행함.
  이유: 이 환경에서 `migrate dev`가 클라이언트를 다시 생성하지 않아 새 컬럼을 모름. 생성 후 시드 정상.

- **2026-09-17** — 시간대 사유 4건, 병용 규칙 `description` 8건, 고민 매핑 `description` 41건을 '~할 수 있어요'체로 통일함. 이유: 둘 다 추천 근거로
  같은 화면에 노출되는 문장이라 말투를 맞춤. 의미는 유지하되 단정 표현은 가능성 표현으로 바꿈.
  시드의 사용자 노출 문장에 '~합니다'체가 남지 않음.

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
pnpm --filter api exec prisma db seed
```

`IngredientGroup`을 조회해 레티노이드류·AHA류·BHA류 = PM, 고농도 비타민C = AM, 나머지 7개 = null이고
시간대가 있는 그룹에만 사유가 있는지 확인.

## 미결 / 후속

- 추천 엔진에서 강제 규칙 구현·테스트 (후보 필터 단계, 요구사항 §5.3.1)
- 강제 규칙 때문에 한 시간대 후보가 0이 되는 경우의 안내 — FR-REC-09 빈 결과 사유와 함께
- 아직 시드 미반영 그룹(보습·항산화·펩타이드·미백 보조)을 추가할 때 시간대 값도 함께 정하기
