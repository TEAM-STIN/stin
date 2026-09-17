# 4단계 세럼 label 시드 반영

- 상태: 완료
- 브랜치: `feat/serum-step-label`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

4단계 루틴 템플릿의 세럼 2개가 DB에서 `가벼운 세럼` / `고농축 세럼`으로 구분된다.
새 DB와 이미 시드된 DB 모두에서 `prisma db seed` 한 번으로 label이 채워지고, 여러 번 돌려도 중복이 생기지 않는다.
`StepCategory.SUNSCREEN` 주석이 요구사항(현재 미사용)과 일치한다.

## 배경

요구사항과 스키마를 맞추는 작업의 두 번째. 요구사항 §4.3·§7.1·§10-5에 "시드는 label 미설정"으로 남아 있었다.
label 문구는 2026-09-17 요구사항 §4.3 표기 그대로 쓰기로 확정.
`SUNSCREEN` 주석은 "Product/RoutineStep에서만 사용"이라 현재 사용 중인 것처럼 읽혀 §4.3·§9와 어긋났다.

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/seed.ts` | 템플릿 단계에 label 추가, 기존 템플릿도 순서 기준으로 label 갱신 |
| `apps/api/prisma/schema.prisma` | `SUNSCREEN` 주석 수정 (스키마 구조 변경 없음, 마이그레이션 없음) |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |
| `docs/requirements.md` | §4.3·§7.1·§10-5 label 상태 갱신 |

## 하위 작업

- [x] 시드 수정
- [x] 이미 시드된 로컬 DB에 시드 실행 → label 채워짐, 2회 실행해도 템플릿 3건·단계 9건 유지
- [x] 템플릿을 지운 로컬 DB에 시드 실행 → 새로 생성되며 label 채워짐
- [x] `SUNSCREEN` 주석 수정, 스키마 문서 재생성
- [x] 요구사항 갱신
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 이미 있는 템플릿은 건너뛰던 로직을 `(templateId, order, category)`가 모두 맞는 단계의 label 갱신으로 바꿈.
  이유: 건너뛰면 기존 개발 DB에는 label이 영영 안 들어감. `RoutineTemplateStep`에 `(templateId, order)` unique가 없어 `updateMany` 사용.
- **2026-09-17** — label은 같은 카테고리가 한 템플릿에 두 번 나올 때만 채움. 이유: 3단계의 세럼 하나는 구분할 대상이 없음.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: 시드는 데이터 준비 스크립트이고, api 테스트 DB 전략이 미결([testing.md](../../testing.md)). 위 두 경로를 로컬 DB에서 직접 확인.

## 검증 방법

```bash
pnpm --filter api exec prisma db seed
```

`RoutineTemplateStep`을 `RoutineTemplate.stepCount`, `order` 순으로 조회해 4단계 2·3번 단계 label이
`가벼운 세럼` / `고농축 세럼`인지, 템플릿 3건·단계 9건인지 확인.

## 미결 / 후속

- 가벼운/고농축 세럼을 어떤 제품 속성으로 가를지(세럼 단계 후보 필터) — 추천 엔진 구현 시 확정
- `(templateId, order)` unique, 단계 수(`stepCount`) unique — 스키마 정리 ④에서 함께
- 머지된 002·003을 `completed/`로 이동 — `completed/`가 AGENTS.md에서 도달 불가라 문서 검사가 고아 문서로 막음. 링크 추가와 함께 별도 PR
- 시드·런타임이 `DATABASE_URL`의 `?schema=`를 무시해 worktree DB 분리가 안 되는 문제 — 별도 작업으로 분리
