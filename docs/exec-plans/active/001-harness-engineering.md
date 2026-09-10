# 하네스 엔지니어링 세팅

- 상태: 진행 중 — Phase 1~4·6 완료. 남은 것은 Phase 5(아키텍처 강제)
- 브랜치: `feat/harness-engineering`
- 작성일: 2026-09-10

## 목표

에이전트가 사람의 중계 없이 STIN 레포에서 작업을 완결할 수 있는 환경을 만든다.
완료 판정은 이 문서 맨 아래 "검증 방법"의 항목들이 전부 통과할 때다.

## 배경

OpenAI 「하네스 엔지니어링: 에이전트 우선 세계에서 Codex 활용하기」(Ryan Lopopolo,
2026-02-11)의 네 가지 원칙을 2인 팀 규모로 축소해 적용한다.

1. **AGENTS.md는 백과사전이 아니라 목차** — 실제 지식은 `docs/`가 기록 시스템
2. **레포 밖 지식을 레포 안으로** — 컨텍스트에서 접근할 수 없는 것은 존재하지 않는 것
3. **불변 조건을 기계적으로 강제** — 문서만으로는 일관성이 유지되지 않는다
4. **에이전트가 앱을 직접 읽게** — 로그·DOM을 사람의 중계 없이 조회

### 원문과 의도적으로 다르게 가는 지점

| 원문 | STIN | 이유 |
|---|---|---|
| 최소한의 차단 병합 게이트 | **강한 게이트** (훅 + CI) | 원문이 단 단서 그대로 — "처리량이 적은 환경에서는 적합하지 않습니다". 1인당 하루 3.5 PR 환경의 규범이다 |
| 사람이 코드를 전혀 쓰지 않음 | 사람도 씀 | 학습이 프로젝트 목표에 포함됨 |
| worktree별 관측 스택 (LogQL·PromQL) | JSON Lines + `jq` 스크립트 | 쿼리 **가능성**은 유지하되 스택은 안 세운다 |
| 리뷰를 거의 전부 에이전트에 위임 | 사람 리뷰 유지 + 에이전트 사전 리뷰 | 팀 규모와 학습 목표 |

### 확정된 전제

- 에이전트: Claude Code + Cursor 병행 → `AGENTS.md`가 단일 정본
- 팀 규모: 2인
- 커밋: Conventional Commits
- **사람 리뷰는 GitHub required approval로 강제하지 않고 관행으로 둔다.**
  리뷰어가 1명뿐이라 강제하면 게이트가 아니라 인질이 된다. 재논의 대상이 아니다

## Phase 1 — 문서 골격 (코드 변경 0)

- [x] 루트 `AGENTS.md` (~100줄 목차)
- [x] `CLAUDE.md` (`@AGENTS.md` 한 줄)
- [x] `.cursor/rules/stin.mdc` (포인터)
- [x] `docs/golden-rules.md` · `workflow.md` · `conventions.md` · `testing.md`
- [x] `docs/exec-plans/` (TEMPLATE · active · completed · tech-debt-tracker)
- [x] `docs/references/README.md`
- [x] `apps/api/AGENTS.md` · `apps/web/AGENTS.md`
- [x] 레포 밖 지식 회수 — `design-system.md`를 시안 없이 자기완결적으로

## Phase 2 — 강제 검증 파이프라인 (핵심)

- [x] 스크립트 정리: `api`의 `lint --fix` 분리, 전 패키지 `typecheck`, `turbo.json` 태스크 추가
- [x] 루트 `verify: turbo run lint typecheck test build`
- [x] `apps/web`에 Vitest + Testing Library 도입 (스모크 테스트 1개로 파이프라인 확인)
- [x] husky + lint-staged + commitlint
      (`pre-commit` → `commit-msg` → `pre-push`)
- [x] `.github/workflows/ci.yml` + `pull_request_template.md`
- [x] `scripts/check-docs.mjs` — AGENTS.md 100줄 상한, 링크 유효성, 고아 문서 탐지.
      **에러 메시지에 수정 지침을 함께 출력한다**
- [x] 브랜치 보호: `main` 직접 push 금지 · PR 필수 · CI check 필수 ·
      approval 필수는 끔 · 대화 해결 필수 · **admin에게도 적용**

## Phase 3 — 로그 가시성 (api 도메인 코드 착수 전)

지금 `apps/api`는 모듈 2개뿐이라 로거 교체 비용이 0이다. 추천 엔진·인증을 쓴 뒤에
넣으면 이미 작성된 코드의 로깅을 전부 고쳐야 한다.

- [x] `nestjs-pino` 도입 — `requestId` 자동 부여 + `AsyncLocalStorage` 전파
- [x] `apps/web` → `apps/api` 호출에 `x-request-id` 전파
- [x] Prisma 쿼리 로그를 같은 로거로 (dev 한정)
- [x] 전역 예외 필터 — `{ requestId, path, code, message, stack }` 통일 +
      자주 나오는 실패에 **수정 지침** 첨부
- [x] 두 갈래 출력: `pino-pretty` → stdout / JSON Lines → `.logs/api.jsonl`
- [x] **`jq` 조회 스크립트** — `logs:errors` · `logs:req <id>` · `logs:slow` · `logs:tail`
      → **`AGENTS.md`의 명령 목록에 반드시 추가.** 빠지면 로깅 전체가 무효
- [x] 마스킹(`redact`): authorization · cookie · password · token · email
- [x] 로그 관리: 부팅 시 truncate, 50MB 롤오버, 원본 직접 `cat` 금지를 `AGENTS.md`에 명시
- [x] `gh run *`를 `.claude/settings.local.json` 허용 목록에 추가

## Phase 4 — 실행 환경 격리와 UI 가시성

- [x] `main.ts`의 포트 불일치 수정 (`PORT ?? 3001`)
- [x] `WEB_PORT` · `API_PORT` 환경변수화
- [x] worktree별 Postgres 스키마 분리 (`?schema=wt_<브랜치>`) — 컨테이너는 하나로
- [x] `scripts/worktree-up.sh` — 한 명령으로 부팅
- [x] `.logs/`를 worktree별로 분리
- [x] `docs/generated/db-schema.md` 생성

## Phase 5 — 아키텍처 강제 (api 첫 도메인 모듈이 서는 즉시)

"나중에"가 아니라 시점을 못 박는다. 지금은 강제할 레이어 자체가 없어서 미룬다.

- [ ] STIN 레이어 정의 → `architecture.md`에 기록.
      `packages/types` → `prisma` → `service` → `controller` (역방향·건너뛰기 금지).
      `packages/types`는 아무것도 import하지 않는다
- [ ] `dependency-cruiser`로 기계적 강제 + CI 편입
- [ ] 커스텀 린트: 파일 크기 상한, 하드코딩 색상 금지, 구조화 로깅 강제
- [ ] 모든 커스텀 룰의 에러 메시지에 수정 지침 포함

## Phase 6 — 정기 정리 루프

에이전트는 레포에 이미 있는 패턴을 복제하므로 드리프트는 필연이다.

- [x] `scripts/gardening.mjs` — 드리프트를 기계가 먼저 뽑는다 (방치된 부채,
      완료됐는데 남은 계획, AGENTS.md 상한 근접, 빈 레퍼런스, 테스트 없는 소스)
- [x] 주간 CI 워크플로 — 정리할 것이 있을 때만 이슈를 연다.
      이미 열린 이슈가 있으면 댓글만 단다 (이슈가 쌓이면 배경 소음이 된다)
- [x] `/code-review` 실행과 `tech-debt-tracker.md` 적재를 절차로 문서화
      (사람이 읽고 판단하는 시간은 10분 이내)
- [ ] 반복되는 지적은 Phase 5의 린트 규칙으로 승격 — Phase 5와 함께 닫힌다

## 결정 로그

- **2026-09-10** — 정리 점검을 "주 1회 사람이 `/code-review`를 돌린다"는 규칙으로만
  두지 않고 **스크립트와 주간 CI로 기계화했다.** 습관에만 의존하면 바쁠 때 가장 먼저
  건너뛴다. 다만 이슈는 정리할 것이 있을 때만 열고, 이미 열린 이슈가 있으면 댓글만
  단다 — 이슈가 쌓이는 순간 아무도 안 보게 되고 점검 자체가 배경 소음이 된다.
- **2026-09-10** — `scripts/`에 `node --test` 기반 테스트를 도입하고 `verify`에 넣었다.
  지금까지 `scripts/`의 코드는 테스트가 없었는데, "구현한 기능에는 테스트를 쓴다"는
  우리 규칙에 예외를 두는 셈이었다.
- **2026-09-10** — 브랜치 보호를 켜려고 레포를 **public으로 전환**했다. Free 조직의
  private 레포는 브랜치 보호도 룰셋도 403이라, 공개하거나 유료 플랜으로 올리는 수밖에
  없었다. 전환 전 히스토리 전체를 비밀값 스캔했고 `.env`는 커밋된 적이 없었다.
- **2026-09-10** — `enforce_admins`를 **true**로 켰다. 처음엔 false로 제안했는데,
  확인해보니 팀원 두 명이 **모두 admin**이라 그 설정이면 둘 다 보호를 우회할 수 있어
  장식이 된다. admin 계정으로 `main`에 직접 push를 시도해 실제로 막히는 것을 확인했다.
- **2026-09-10** — 사람 리뷰를 GitHub required approval로 강제하지 않기로 함.
  이유: 2인 팀에서 리뷰어가 1명뿐이라 강제하면 상대 부재 시 모든 머지가 막힌다.
  대신 워크플로 5단계의 에이전트 사전 리뷰가 그 자리를 메운다.
- **2026-09-10** — 로그 가시성을 Phase 3으로 앞당김. 이유: api가 스캐폴드 상태인
  지금이 교체 비용이 가장 낮고, 도메인 코드가 처음부터 구조화 로그 위에서 쓰이게 하려고.
- **2026-09-10** — 린트에 `--max-warnings 0`을 걸어 경고도 차단하기로 함. 이유: 경고는
  아무도 안 읽는다. 게이트가 되려면 통과/실패 둘 중 하나여야 한다. 켜자마자
  `prisma.service.ts`의 Prettier 위반 2건이 드러났다 — `--fix`가 매 실행마다 조용히
  고쳐놓고 있어서 레포의 파일은 한 번도 규격에 맞은 적이 없었다.
- **2026-09-10** — `.logs/` 분리를 위한 별도 작업은 필요 없었다. `findRepoRoot`가
  `__dirname`에서 위로 올라가며 `pnpm-workspace.yaml`을 찾으므로, worktree 안에서
  실행하면 그 worktree의 `.logs/`가 잡힌다. 실제로 두 개를 띄워 교차 오염 0건을 확인했다.
- **2026-09-10** — 생성 문서의 신선도를 mtime이 아니라 **내용 해시**로 판정한다.
  mtime은 git 체크아웃마다 바뀌어서 CI에서 판정이 뒤집힌다.
- **2026-09-10** — 빈 문자열 환경변수 함정. `.env`에 `LOG_LEVEL=`만 적히면 `??`를
  통과해 pino가 부팅에 실패한다. `.env.example`이 바로 그 형태였고, 복사한 사람은
  서버가 안 떴다. Phase 3의 ts-node 검증에서는 변수를 아예 설정하지 않아
  (undefined였지 빈 문자열이 아니어서) 드러나지 않았다. **실제로 띄워봐야 나오는 종류다.**
- **2026-09-10** — 조회 도구를 `jq`가 아니라 Node(`scripts/logs.mjs`)로 씀.
  이유: `jq`는 macOS 기본 설치가 아니라 팀원이 따로 깔아야 한다. Node는 이 레포가
  이미 요구한다(engines: node >= 24). 도구 설치를 전제하면 "그냥 cat 하기"로 돌아간다.
- **2026-09-10** — 예외 필터의 로그 레벨을 상태 코드로 나눔(4xx는 warn, 5xx는 error).
  처음엔 전부 error로 남겼는데, 실제로 띄워보니 404가 `logs:errors`를 뒤덮어
  진짜 500이 묻혔다. 로그가 많으면 없는 것과 같다.
- **2026-09-10** — `main.ts` 포트를 3001로 수정 (Phase 4 항목 선반영).
  로깅을 검증하려면 서버를 띄워야 하는데, 3000이면 `apps/web`과 충돌해서 미룰 수 없었다.
- **2026-09-10** — `apps/web`의 `typecheck`를 `next typegen && tsc --noEmit`으로.
  이유: `LayoutProps` 같은 전역 타입을 Next 16이 `.next/types/`에 생성하므로,
  `.next`가 없는 깨끗한 체크아웃에서는 `tsc`만으로 실패한다. 로컬에서는 남아 있던
  `.next` 때문에 통과해서 **가짜 green**이었고, CI가 이걸 잡아냈다.
- **2026-09-10** — 로깅 스택은 `nestjs-pino`. 이유: JSON 네이티브 + requestId 부여 +
  redact 마스킹 + 멀티 스트림이 전부 내장이라 직접 구현할 것이 없다.

## 검증 방법

**하네스가 실제로 "막는지"를 확인한다.** 설정이 존재하는지가 아니라.

Phase 2 이후:

1. `pnpm install && pnpm verify` → 전부 green
2. 일부러 lint 에러를 넣고 `git commit` → 훅이 커밋을 차단
3. 커밋 메시지 `wip` → commitlint가 거부
4. `AGENTS.md`에 더미 120줄 → `check-docs`가 **수정 지침과 함께** 실패
5. 실패 테스트를 push → CI red, 머지 버튼 잠김
6. 새 Claude Code 세션에 "온보딩 화면 만들어줘" → `AGENTS.md`부터 읽고 exec-plan을 만드는지
7. Cursor에서 같은 지시 → 동일 절차를 따르는지. 갈리면 `.cursor/rules/stin.mdc` 문구만 조정

Phase 3~4 이후:

8. worktree 두 개 동시 부팅 → 포트·DB 스키마 충돌 없이 뜨는지
9. **로그 가시성 판정** — 500을 내는 엔드포인트를 만들고 재현 방법을 알려주지 않은 채
   "이 요청이 실패한다, 고쳐줘"만 준다.
   - `logs:errors`를 **스스로 찾아 실행**하는지
   - `requestId`로 HTTP → 서비스 → SQL을 한 줄기로 묶어 읽는지
   - **사람에게 "터미널 로그를 붙여달라"고 묻지 않는지** ← 물으면 실패다
10. JWT·이메일이 담긴 요청 후 `.logs/api.jsonl`에서 마스킹 확인
11. CI를 깨뜨리고 "CI가 깨졌다"만 전달 → `gh run view --log-failed`로 스스로 읽는지

**6~11번이 최종 판정이다.** 나머지는 그걸 위한 준비다.
특히 9·11번에서 에이전트가 사람에게 로그를 요청하면 하네스가 아직 닫히지 않은 것이다.

## 미결

- `docs/references/*-llms.txt` 확보 방법 (공식 llms.txt 유무 확인 필요)
- `apps/api` 테스트가 실제 DB를 쓸지 목을 쓸지 → 추천 엔진 착수 시 결정
- 디자인 시안 처리: 자기완결적으로 옮기기(권장) / 레포에 커밋 / 접근 불가 명시
