# User 소셜 로그인 스키마 전환

- 상태: 진행 중
- 브랜치: `feat/user-social-login`
- 관련 이슈: 없음
- 작성일: 2026-09-17

## 목표

`User`가 `(provider, providerId)`로 식별되고 비밀번호 컬럼이 없다. 이메일은 없어도 되고 unique가 아니다.
요구사항 §10-2가 `[구현됨]`으로 바뀌고, 확정된 탈퇴 정책이 문서에 남는다.

## 배경

요구사항과 스키마를 맞추는 작업의 세 번째. 인증은 소셜 로그인만 제공하는데(FR-AUTH-01·02)
스키마는 `email` unique + `passwordHash` 필수인 자체 로그인 구조였다.
2026-09-17 결정: 카카오 단일, 이메일 선택 동의, 탈퇴는 계정 행 유지 + 개인정보 삭제 / 저장 루틴 삭제 / 리뷰·추천 유지.
탈퇴(FR-AUTH-09, 선택)는 정책 변경이라 스키마 반영을 다음 작업으로 분리했다.
결정 배경은 [architecture.md](../../architecture.md) "왜 사용자를 이메일이 아니라 (provider, providerId)로 식별하는가".

## 변경할 파일

| 파일 | 무엇을 |
|---|---|
| `apps/api/prisma/schema.prisma` | `AuthProvider` enum, `User`에 `provider`·`providerId`·`profileImageUrl`, `passwordHash` 제거, `email` nullable·unique 해제, `@@unique([provider, providerId])` |
| `apps/api/prisma/migrations/<시각>_user_social_login/` | 위 변경 마이그레이션 |
| `docs/generated/db-schema.md` | `pnpm db:schema:doc` 재생성 |
| `docs/requirements.md` | §5.1·FR-AUTH-01·02·04·05·09, §10-2 결정 반영 |
| `docs/architecture.md` | 식별자를 `(provider, providerId)`로 둔 이유 |

## 하위 작업

- [x] 스키마 수정
- [x] 마이그레이션 생성, SQL 확인 (`passwordHash` DROP 포함 — 로컬 `User` 0건, api 코드·시드에서 `User` 미사용 확인)
- [x] 로컬 DB 적용 후 스키마와 차이 없음 확인 (`migrate diff --exit-code` 0)
- [x] 로컬 DB에서 같은 `(provider, providerId)` 거부, 다른 계정의 같은 이메일 허용, 없는 제공자 값 거부 확인 (트랜잭션 후 롤백)
- [x] 요구사항·아키텍처 문서 갱신
- [x] `pnpm verify` 통과
- [x] `/code-review` 통과

## 결정 로그

- **2026-09-17** — 마이그레이션을 `prisma migrate diff --from-config-datasource --to-schema --script`로 생성함.
  이유: unique 제약 추가 경고 때문에 `migrate dev`(`--create-only` 포함)가 확인 입력을 요구하는데, 에이전트 실행 환경은
  비대화형이라 중단됨. 로컬 DB가 직전 마이그레이션까지 적용된 상태에서 DB → 스키마 diff를 뽑았으므로 `migrate dev`가 만들 SQL과 같음.
  적용은 `migrate deploy`, 이후 diff가 비어 있음을 확인.
- **2026-09-17** — `provider`·`providerId`를 기본값 없는 NOT NULL로 추가함. 이유: 배포된 DB가 없고 로컬 `User`도 0건.
  `User` 행이 있는 DB에서는 이 마이그레이션이 실패하므로, 팀원 로컬 DB에 사용자 데이터가 있으면 먼저 비워야 함.
- **2026-09-17** — `providerId`는 이번에 NOT NULL로 둠. 이유: 탈퇴 시 비우는 동작은 다음 작업에서 탈퇴 스키마와 함께 정함.
- **2026-09-17** — 자동 테스트는 추가하지 않음. 이유: api 테스트 DB 전략 미결([testing.md](../../testing.md)). 로그인 API 구현 시 검증.

## 검증 방법

```bash
pnpm --filter api exec prisma migrate status
pnpm --filter api exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

두 번째 명령의 종료 코드가 0이면 DB와 스키마가 일치.

## 미결 / 후속

- 탈퇴 익명화 스키마 — `deletedAt`, 탈퇴 시 `providerId` 비우기(nullable 전환), `Routine.user` 삭제 처리
- 카카오 OAuth 환경변수(`.env.example`)와 로그인 API — API 구현 시
- `migrate dev`가 비대화형 환경에서 막히는 경우의 절차를 `apps/api/AGENTS.md` "스키마 변경"에 추가할지 검토
