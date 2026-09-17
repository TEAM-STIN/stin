# @stin/types를 스키마·요구사항에 맞춤

- 상태: 완료
- 브랜치: `feat/types-align-schema`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

`packages/types/src/index.ts`의 값·이름·필드가 [schema.prisma](../../../apps/api/prisma/schema.prisma)와
[requirements.md](../../requirements.md)에 맞고, 이를 쓰는 web 온보딩이 바뀐 값으로 동작한다.
`pnpm verify` 통과 + 브라우저에서 온보딩 1→2→3단계 URL과 선택 복원이 새 값으로 동작하면 끝.

## 배경

요구사항과 스키마를 맞추는 작업(#37~#43)이 끝나 스키마가 정본으로 정리됐다. 타입은 그 전에 작성돼
고민 태그·리뷰 값·ID 타입·인증 방식이 모두 달랐다. 2026-09-17 결정:

- 단계 수는 숫자 `2 | 3 | 4`(`stepCount`). 온보딩 URL도 `level=LEVEL_2` → `stepCount=2`
- 범위는 기존 타입 정렬 + 요구사항 필드 보강. 새 엔드포인트 타입(재분석, 리뷰 목록 페이지, 추천 토글, 저장 루틴 상세)은 API 구현 시
- 작업 중이던 한글 표기 주석은 유지, `SERUM_LIGHT`/`SERUM_RICH`는 `StepCategory` + `label`로 대체

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `packages/types/src/index.ts` | 아래 "타입 변경" 전부 |
| `apps/web/lib/onboarding/concerns.ts` (+ test) | `Concern` → `ConcernTag`, 값 변경 |
| `apps/web/lib/onboarding/routine-levels.ts` (+ test) | `RoutineLevel` → `StepCount`, `isRoutineLevel` → `parseStepCount` |
| `apps/web/components/onboarding/routine-level-form.tsx` (+ test) | 상태·URL `stepCount` |
| `apps/web/components/onboarding/concerns-form.tsx` (+ test) | 타입 이름 |
| `apps/web/app/onboarding/routine-level/page.tsx` | `stepCount` 쿼리 파싱 |
| `docs/architecture.md` | 타입 이름을 스키마에 맞춘 이유 |
| `apps/api/prisma/seed.ts` | 추천 단계 수 3단계 통일: 3단계 템플릿 `recommendedSkinTypes`에 5개 피부타입, 기존 템플릿도 갱신 |

## 타입 변경

- enum: `Concern` → `ConcernTag`(`TROUBLE`·`PORE`·`SENSITIVE`·`WRINKLE`), `StepType` → `StepCategory`(`TONER`·`SERUM`·`CREAM`),
  `RoutineLevel` → `StepCount`, `UsagePeriod` → `UsageDuration`, `NegativeReason` → `DissatisfactionTag`(4종),
  `Verdict` 제거(`isPositive`), `AuthProvider` 추가
- ID 전부 `number` → `string`
- 제품: `price` 필수, `texture`·`purchaseUrl` 제거, `isNoncomedogenic`·`suitableSkinTypes` 추가, 평가 요약은 총 리뷰 수 + 좋아요 수
- 루틴: 단계에 `label`, `reason` → `reasonText`, 추천 레벨 응답 → 템플릿 요약(`recommendedSkinTypes`)
- 저장 루틴: 루틴 하나에 AM/PM 단계, `timeOfDay`·`concernsAtCreation` 제거, `skinTypeSnapshot`
- 리뷰: 스키마 필드명, 추천 수·내가 추천했는지·내 리뷰인지(FR-REV-20·21)
- 인증: `LoginRequest`(email/password) 제거, `AuthUser`에 `email?`·`profileImageUrl`

## 하위 작업

- [x] 타입 수정
- [x] web 온보딩 코드·테스트 수정
- [x] 브라우저로 온보딩 1→2→3단계 확인 (URL, 선택 복원, 추천 배지)
- [x] 아키텍처 문서
- [x] 추천 단계 수 3단계 통일 (web 매핑·시드), 시드 재실행 후 DB 확인
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — web 파일·컴포넌트 이름(`routine-levels.ts`, `RoutineLevelForm`)은 유지. 이유: 화면 이름(온보딩 "단계 수 선택")을 가리키고,
  이름까지 바꾸면 diff가 커져 값 변경 리뷰가 어려워짐. URL 쿼리 이름 `concerns`도 화면 파라미터라 유지.
- **2026-09-17** — `SUNSCREEN`은 계약에서 뺌. 이유: 요구사항 §4.3·§9에서 현재 미사용. 쓰게 될 때 추가.
- **2026-09-17** — 근거 수준(`EvidenceLevel`) 노출(FR-RSN-04)·빈 결과 사유(FR-REC-09)·재구매 의향 필수 여부는 넣지 않음.
  이유: 노출 여부·필수 여부가 `[확정 필요]`거나 응답 모양이 API 설계에 달림.

- **2026-09-17** — 추천 단계 수를 모든 피부타입 3단계로 통일함. 이유: web 임시 매핑(건성 3·수부지 4)과 시드
  `recommendedSkinTypes`(건성 4·수부지 2)가 달랐음. 결정에 따라 web 매핑과 시드를 함께 맞추고, 기존 DB도 시드로 갱신되게 함.

## 검증 방법

```bash
pnpm verify
```

브라우저: `/onboarding/skin-type` → 지성 → 트러블·모공 → 3단계 화면 URL이 `concerns=TROUBLE,PORE`,
"루틴 추천받기" 이동 URL이 `stepCount=N`, 뒤로가기·새로고침 시 선택 복원.

## 미결 / 후속

- 새 엔드포인트 타입은 각 API 구현 PR에서 추가
