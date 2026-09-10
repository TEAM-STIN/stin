# AGENTS.md

STIN 레포에서 작업하는 모든 에이전트의 진입점이다.

> **이 파일은 목차이지 백과사전이 아니다. 100줄을 넘기지 않는다.**
> 넘으면 내용을 `docs/` 하위 문서로 옮기고 여기엔 한 줄 포인터만 남긴다. 이유:
> ① 컨텍스트는 희소 자원이다 ② 지침이 너무 많으면 지침이 아니다
> ③ 거대 매뉴얼은 낡은 규칙의 무덤이 된다 ④ 단일 블롭은 기계적 점검이 불가능하다
>
> 규칙을 바꿀 때는 **이 파일만** 고친다. `CLAUDE.md`와 `.cursor/rules/`는 포인터일 뿐이다.

## 프로젝트

피부타입·피부고민 기반 스킨케어 **루틴** 추천 서비스. 모바일 전용(390px 고정).

pnpm workspace 모노레포 — `apps/web`(Next.js 16) · `apps/api`(NestJS 11) · `packages/types`(공유 타입).
DB는 PostgreSQL + Prisma 7. 배포는 AWS EC2 + Nginx + Docker Compose.

## 무엇을 언제 읽나

| 문서 | 읽어야 할 때 |
|---|---|
| [docs/golden-rules.md](docs/golden-rules.md) | **코드를 쓰기 전에 항상** |
| [docs/workflow.md](docs/workflow.md) | 작업을 시작할 때 (계획 → 구현 → 검증 → PR) |
| [docs/conventions.md](docs/conventions.md) | 커밋·브랜치·PR·네이밍이 필요할 때 |
| [docs/testing.md](docs/testing.md) | 테스트를 쓸 때 |
| [docs/requirements.md](docs/requirements.md) | 기능 범위·용어가 모호할 때 |
| [docs/architecture.md](docs/architecture.md) | 결정의 배경이 필요할 때 / **새 결정을 남길 때** |
| [docs/design-system.md](docs/design-system.md) | UI를 만들 때 (색·타이포·radius 토큰) |
| [docs/functional-ingredients.md](docs/functional-ingredients.md) | 성분·추천 로직을 다룰 때 |
| [docs/references/](docs/references/) | Prisma·Next·Nest API가 기억과 다를 때 |
| [docs/exec-plans/active/](docs/exec-plans/active/) | 진행 중인 작업 계획 |
| [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) | 데이터 모델의 **정본** |

하위 디렉터리에 국소 규칙이 있다 — [apps/web/AGENTS.md](apps/web/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md).

## 항상 지키는 규칙

1. **계획 없이 코드를 쓰지 않는다.** 절차는 [docs/workflow.md](docs/workflow.md).
2. **`main`에서 직접 작업하지 않는다.** 브랜치 또는 worktree에서 한다.
3. **구현한 기능에는 테스트를 쓴다.** 기준은 [docs/testing.md](docs/testing.md).
4. **커밋 전에 `pnpm verify`를 통과시킨다.** 실패하면 커밋하지 않는다.
   Git 훅이 자동으로 막지만, 훅은 우회 가능하므로 CI가 최종 방어선이다.
5. **비밀값을 커밋하지 않는다.** `.env`는 절대 스테이징하지 않는다. `.env.example`만 갱신한다.
6. **결정을 내렸으면 [docs/architecture.md](docs/architecture.md)에 "왜"를 남긴다.** 코드만 남기지 않는다.
7. **레포 밖 지식에 의존하지 않는다.** 슬랙·구글독스·외부 시안에만 있는 합의는
   에이전트에게 존재하지 않는 것이다. 근거가 필요하면 먼저 레포로 옮긴다.

## 자주 쓰는 명령

```bash
pnpm install
docker compose up -d                       # PostgreSQL
pnpm --filter web dev                      # http://localhost:3000
pnpm --filter api start:dev                # http://localhost:3001
pnpm verify                                # 린트·타입·테스트·빌드·문서 전체
pnpm lint / pnpm test / pnpm typecheck      # 개별
pnpm --filter api exec prisma migrate dev
pnpm --filter api exec prisma db seed
gh pr checks                               # 현재 PR의 CI 상태
gh run view --log-failed                   # 실패한 CI 로그
```

## 막혔을 때

추측해서 진행하지 말고 멈춘다. 특히:

- **요구사항이 갈린다** → [docs/requirements.md](docs/requirements.md) §10 미확정 사항을 먼저
  확인한다. 거기에도 없으면 사람에게 묻는다.
- **디자인 값이 문서에 없다** → 임의로 정하지 않는다. 정해지면 `docs/design-system.md`에 추가한다.
- **프레임워크 API가 기억과 다르다** → 추측 금지. `docs/references/`와 `node_modules/`의 실제
  타입을 확인한다. Next 16 · Prisma 7 · NestJS 11은 학습 데이터보다 최신이다.
- **규칙끼리 충돌한다** → 이 파일이 우선한다. 충돌 자체를 사람에게 보고한다.
