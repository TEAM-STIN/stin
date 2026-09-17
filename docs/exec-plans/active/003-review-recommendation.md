# 리뷰 추천 모델 추가

- 상태: 진행 중
- 브랜치: `feat/review-recommendation`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

`ReviewRecommendation` 모델이 스키마·마이그레이션에 반영되어, 요구사항 §10-3이 `[구현됨]`으로 바뀐다.
DB에서 한 사용자가 한 리뷰를 두 번 추천할 수 없고, 리뷰를 삭제하면 추천 기록도 함께 삭제된다.

## 배경

요구사항과 스키마를 맞추는 작업의 첫 번째. FR-REV-18~22(리뷰 추천)가 필수인데 스키마에 자리가 없었다.
요구사항 §10-3에 모델 초안이 있어 결정이 필요 없는 항목부터 진행한다.
결정 배경은 [architecture.md](../../architecture.md) "왜 리뷰 추천을 카운터 컬럼이 아니라 기록 테이블로 뒀는가".

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | `ReviewRecommendation` 모델, `User`·`Review` 역방향 관계 |
| `apps/api/prisma/migrations/<시각>_add_review_recommendation/` | 테이블·unique·FK 생성 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |
| `docs/requirements.md` | §2·FR-REV-18·19 `[구현됨]`, §10-3 확정 표시, §7.1 잘못된 절 참조(§10-3 → §10-4) 수정 |
| `docs/architecture.md` | 기록 테이블로 둔 이유 |

## 하위 작업

- [x] 스키마 수정, `prisma migrate dev`로 마이그레이션 생성, SQL 확인 (테이블 추가만, 기존 데이터 영향 없음)
- [x] 로컬 DB에서 중복 추천 거부·리뷰 삭제 시 추천 삭제 확인 (트랜잭션 후 롤백)
- [x] 요구사항·아키텍처 문서 갱신
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 초안의 `@@index([reviewId])`는 넣지 않음. 이유: `@@unique([reviewId, userId])`가 `reviewId` 선두 인덱스라
  리뷰별 조회·집계를 커버함. 같은 인덱스를 두 번 두면 쓰기 비용만 늘어남.
- **2026-09-17** — `ReviewRecommendation.user`는 기본값(RESTRICT) 유지. 이유: 탈퇴 시 익명화 방식이 §10-2 작업에서 정해짐.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: `apps/api` 테스트 DB 전략 미결([testing.md](../../testing.md)).
  추천 토글·본인 리뷰 차단은 API 구현 시 서비스 테스트로 검증.

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
```

로컬 DB 트랜잭션에서 리뷰 1건 + 추천 1건 생성 → 같은 `(reviewId, userId)` 재삽입이 unique 위반으로 거부되는지,
리뷰 삭제 후 추천이 0건인지 확인 후 롤백.

## 미결 / 후속

- 추천 토글 API, 본인 리뷰 추천 차단(FR-REV-20), 추천순 정렬 쿼리
- 사용자 탈퇴 시 추천 기록 처리 — §10-2 `User` 작업에서 함께
