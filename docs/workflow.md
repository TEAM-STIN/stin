# 작업 절차

한 작업을 시작해서 머지하기까지의 순서. 사람과 에이전트 모두 이 절차를 따른다.

## 0. 무엇을 읽고 시작하나

`AGENTS.md` → 이 문서 → 작업에 해당하는 하위 문서 순으로 읽는다.
`AGENTS.md`의 목차 표가 "무엇을 언제 읽는지"를 알려준다.

## 1. EXEC_PLAN 작성

**계획 없이 코드를 쓰지 않는다.**

`docs/exec-plans/active/<번호>-<슬러그>.md`에 [TEMPLATE.md](exec-plans/TEMPLATE.md)를
복사해서 만든다. 담을 것: 목표 / 변경할 파일 / 체크박스 하위 작업 / 결정 로그.

**생략해도 되는 경우** — 아래에 전부 해당할 때만:

- 변경 파일이 3개 이하
- 새 의존성·새 스키마·새 API 엔드포인트가 없다
- 되돌리기 쉽다 (오타, 문구 수정, 값 조정)

애매하면 쓴다. 계획을 쓰는 비용이 잘못 만든 것을 되돌리는 비용보다 항상 싸다.

## 2. 브랜치 또는 worktree에서 구현

`main`에서 직접 작업하지 않는다. 브랜치 이름 규칙은 [conventions.md](conventions.md).

동시에 여러 작업을 굴린다면 `git worktree`를 쓴다.

## 3. 테스트 작성 (건너뛸 수 없음)

기준은 [testing.md](testing.md). "나중에 쓰겠다"는 없다 — 나중은 오지 않는다.

## 4. 검증 실행

```bash
pnpm verify   # 린트 · 타입체크 · 테스트 · 빌드 · 문서 검사
```

**통과하지 못하면 커밋하지 않는다.** 실패를 남긴 채로 PR을 열지 않는다.

이건 권고가 아니라 강제다. Git 훅이 자동으로 막는다:

| 시점 | 검사 |
|---|---|
| `pre-commit` | 스테이지된 파일 린트 + 전체 타입체크·테스트 |
| `commit-msg` | 커밋 메시지 형식 ([conventions.md](conventions.md)) |
| `pre-push` | `pnpm verify` 전체 |

훅은 `--no-verify`로 우회할 수 있다. **그래서 CI가 최종 방어선이다** — 우회하면
PR에서 빨갛게 뜨고 머지가 막힌다.

## 5. 에이전트 사전 리뷰

PR을 열기 전에 `/code-review`로 스스로 검토하고, 나온 지적을 해소한다.

2인 팀에서 사람 리뷰는 가장 희소한 자원이다. 기계가 먼저 걸러낸 뒤
사람은 **판단이 필요한 것만** 보게 한다.

## 6. PR → 리뷰 → 머지

- PR 본문에 exec-plan 링크를 넣는다
- CI 통과가 실질적인 게이트다. 사람 승인은 GitHub이 강제하지 않는다 —
  둘 다 있을 때는 서로 보고, 급하면 CI를 믿고 머지한다
- 머지 후 exec-plan을 `docs/exec-plans/completed/`로 옮긴다

## UI를 바꿨다면

렌더링을 **직접 확인한다.** 브라우저로 열어 보지 않고 "될 것이다"로 넘기지 않는다.
사람에게 "확인해 주세요"라고 떠넘기는 것도 확인이 아니다.

## 남의 브랜치를 가져올 때

리뷰하거나 이어받을 때. `<브랜치>`는 예를 들어 `feat/harness-engineering`.

```bash
git fetch origin
git switch <브랜치>        # 원격 브랜치를 자동으로 추적한다
pnpm install               # 의존성이나 Git 훅이 바뀌었을 수 있다
```

머지된 뒤에 최신 `main`을 받을 때:

```bash
git switch main && git pull
```

### 반드시 지킬 것

- **처음 클론했다면 `.env`를 먼저 만든다.** 없으면 `pnpm install` 자체가 실패한다
  (`apps/api`의 postinstall이 `prisma generate`를 돌리며 `DATABASE_URL`을 요구한다).
  `cp apps/api/.env.example apps/api/.env` — 자세히는 [README](../README.md)
- **`pnpm install`을 건너뛰지 않는다.** Git 훅은 `pnpm install` 시점에 설치된다.
  건너뛰면 훅이 없는 채로 작업하게 되고, 커밋이 로컬에서 차단되지 않아
  CI에서만 깨진다
- **작업 중이던 변경이 있으면 먼저 커밋하거나 `git stash`한다.** 브랜치 전환 전에
  `git status`로 확인한다
- **에이전트 설정 파일은 따로 할 일이 없다.** `AGENTS.md` · `CLAUDE.md` ·
  `.cursor/rules/`는 전부 레포에 커밋되어 있어서 pull하면 그대로 적용된다.
  개인 설정을 따로 만들지 않는다 — 만들면 팀과 갈라진다

### 리뷰할 때 보는 것

- CI가 green인가 (`gh pr checks`)
- exec-plan이 링크돼 있고, 실제 변경이 계획과 맞는가
- 규칙이 바뀌었다면 `AGENTS.md`만 고쳤는가 (포인터 파일에 본문을 복사하지 않았는가)

## 피드백 승격 규칙

**리뷰에서 같은 지적이 두 번 나오면, 그때 고치고 끝내지 않는다.**
문서에 규칙으로 적거나 린트 규칙으로 만든다.

사람의 취향은 한 번 인코딩되면 그 뒤의 모든 코드에 자동으로 적용된다.
반복되는 지적을 매번 손으로 잡는 것은 확장되지 않는다.

승격 위치:
- 판단이 필요한 것 → [golden-rules.md](golden-rules.md)
- 기계가 판정할 수 있는 것 → 린트 규칙
- 되풀이되지만 지금 못 고치는 것 → [exec-plans/tech-debt-tracker.md](exec-plans/tech-debt-tracker.md)
