<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/web

Next.js 16 + Tailwind v4 + shadcn/ui. 루트 [`AGENTS.md`](../../AGENTS.md)를 먼저 읽는다.

> 위의 `nextjs-agent-rules` 블록은 `next dev`가 자동으로 다시 써 넣는다.
> **지우지 말 것.** 우리 규칙은 이 아래에만 적는다.

## 절대 규칙

- **모바일 전용, 390px 고정.** 반응형 분기를 만들지 않는다. 데스크톱은 프레임을
  중앙 정렬하고 뒤에 backdrop만 깐다
- **다크모드 미지원.** `globals.css`에 `dark` variant가 있지만 `.dark` 클래스를
  어디에도 붙이지 않으므로 shadcn의 `dark:` 유틸은 전부 죽는다. 새로 쓰지 않는다
- **색·간격·radius는 하드코딩하지 않는다.** 전부 `app/globals.css` 토큰을 거친다.
  토큰에 없으면 토큰을 먼저 추가하고 [`docs/design-system.md`](../../docs/design-system.md)에 적는다

## 컴포넌트 배치

```
components/ui/*         shadcn 생성물. 원본에 가깝게 유지 — 색/크기는 토큰으로 최소 수정만
components/*            여러 화면이 공유하는 우리 조합 컴포넌트
components/<feature>/*  특정 화면 전용. 다른 화면에서 필요해지면 승격 검토
```

- shadcn 추가는 `pnpm dlx shadcn@latest add <name>`, **PR로 올린다**
- 아이콘은 `lucide-react`, 기본 `strokeWidth={1.8}`
- 한글 본문은 `break-keep`

값(색 토큰·타이포 스케일·radius·그림자)의 정본은
[`docs/design-system.md`](../../docs/design-system.md)다.

## UI를 바꿨으면

**브라우저로 직접 확인한다.** "될 것이다"로 넘기거나 사람에게 확인을 떠넘기지 않는다.
[`docs/workflow.md`](../../docs/workflow.md).

## 테스트

Vitest + Testing Library. 아직 도입 전이다 —
[`exec-plans/active/001-harness-engineering.md`](../../docs/exec-plans/active/001-harness-engineering.md) Phase 2.
