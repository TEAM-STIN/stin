#!/usr/bin/env node
// 문서 자체를 기계적으로 검사한다.
//
// 왜: AGENTS.md를 "목차"로 두는 구조는 문서가 최신이고 서로 연결돼 있을 때만 성립한다.
// 단일 거대 파일이 실패하는 이유 중 하나가 "기계적 점검이 불가능하다"는 것이었으므로,
// 검사가 없으면 목차 구조 자체가 무의미해진다.
//
// 에러 메시지에는 반드시 "어떻게 고치는지"를 함께 담는다. 사람이든 에이전트든
// 메시지만 읽고 다음 행동을 알 수 있어야 한다.

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS_MAX_LINES = 100;

const problems = [];
const fail = (what, how) => problems.push({ what, how });

const rel = (p) => relative(ROOT, p) || '.';
const read = (p) => readFileSync(p, 'utf8');

/** 검사 대상 마크다운 파일을 모은다 (node_modules 제외). */
function collectDocs() {
  const out = [];
  for (const f of ['README.md', 'AGENTS.md', 'CLAUDE.md']) {
    if (existsSync(join(ROOT, f))) out.push(join(ROOT, f));
  }
  for (const app of ['apps/web', 'apps/api', 'packages/types']) {
    const p = join(ROOT, app, 'AGENTS.md');
    if (existsSync(p)) out.push(p);
  }
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (extname(e.name) === '.md') out.push(p);
    }
  };
  walk(join(ROOT, 'docs'));
  return out;
}

/** 마크다운 본문에서 상대 링크 대상만 뽑는다 (외부 URL·앵커 전용 링크 제외). */
function linksIn(text) {
  const out = [];
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target) continue;
    if (/^(https?:|mailto:)/.test(target)) continue;
    out.push(target);
  }
  return out;
}

const docs = collectDocs();

// ── 1. AGENTS.md는 목차다. 길어지면 하위 문서로 옮겨야 한다. ──────────────
const agentsPath = join(ROOT, 'AGENTS.md');
if (!existsSync(agentsPath)) {
  fail('AGENTS.md가 없습니다.', '루트에 AGENTS.md를 만드세요. 에이전트의 유일한 진입점입니다.');
} else {
  const lines = read(agentsPath).split('\n').length;
  if (lines > AGENTS_MAX_LINES) {
    fail(
      `AGENTS.md가 ${lines}줄입니다 (상한 ${AGENTS_MAX_LINES}).`,
      '가장 긴 섹션을 docs/ 하위 문서로 옮기고 AGENTS.md에는 한 줄 포인터만 남기세요.\n' +
        '     AGENTS.md는 백과사전이 아니라 목차입니다. 지침이 너무 많으면 지침이 되지 않습니다.',
    );
  }
}

// ── 2. 상대 링크가 실재하는 파일을 가리키는가 ────────────────────────────
for (const doc of docs) {
  for (const target of linksIn(read(doc))) {
    if (!existsSync(resolve(dirname(doc), target))) {
      fail(
        `${rel(doc)} 의 링크가 깨졌습니다 → ${target}`,
        '파일을 옮겼다면 링크를 고치고, 문서를 지웠다면 이 링크도 지우세요.\n' +
          '     에이전트는 깨진 링크를 만나면 그 지식이 없는 것으로 취급합니다.',
      );
    }
  }
}

// ── 3. 고아 문서: AGENTS.md에서 도달할 수 없는 문서 ──────────────────────
// 링크가 디렉터리를 가리키면 그 안의 .md를 전부 도달 가능한 것으로 본다.
const reachable = new Set();
const queue = [agentsPath];
while (queue.length) {
  const cur = queue.pop();
  if (!cur || reachable.has(cur) || !existsSync(cur)) continue;
  reachable.add(cur);
  for (const target of linksIn(read(cur))) {
    const p = resolve(dirname(cur), target);
    if (!existsSync(p)) continue;
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p)) {
        if (extname(e) === '.md') queue.push(join(p, e));
      }
    } else if (extname(p) === '.md') {
      queue.push(p);
    }
  }
}

// README.md와 CLAUDE.md는 사람/도구용 진입점이라 목차 도달성에서 제외한다.
const exempt = new Set([join(ROOT, 'README.md'), join(ROOT, 'CLAUDE.md')]);
for (const doc of docs) {
  if (reachable.has(doc) || exempt.has(doc)) continue;
  fail(
    `${rel(doc)} 는 AGENTS.md에서 도달할 수 없습니다 (고아 문서).`,
    'AGENTS.md의 목차 표에 추가하거나, 이미 목차에 있는 문서에서 링크하세요.\n' +
      '     에이전트가 찾아갈 수 없는 문서는 없는 문서와 같습니다.',
  );
}

// ── 4. 스키마가 바뀌면 생성 문서도 함께 바뀌어야 한다 ────────────────────
// mtime은 git 체크아웃마다 바뀌어서 CI에서 판정이 뒤집힌다. 내용 해시로 본다.
const generated = join(ROOT, 'docs/generated/db-schema.md');
const schema = join(ROOT, 'apps/api/prisma/schema.prisma');
if (existsSync(generated) && existsSync(schema)) {
  const expected = createHash('sha256')
    .update(read(schema))
    .digest('hex')
    .slice(0, 16);
  const recorded = /<!-- schema-hash: ([0-9a-f]+) -->/.exec(read(generated))?.[1];

  if (recorded !== expected) {
    fail(
      'docs/generated/db-schema.md가 schema.prisma와 어긋납니다.',
      '`pnpm db:schema:doc`을 실행해 다시 만들고 함께 커밋하세요.\n' +
        '     문서를 손으로 고치지 마세요 — 스키마와 어긋나면 에이전트가\n' +
        '     존재하지 않는 필드를 참조합니다.',
    );
  }
}

// ── 결과 ────────────────────────────────────────────────────────────────
if (problems.length === 0) {
  console.log(`✓ 문서 검사 통과 (${docs.length}개 문서)`);
  process.exit(0);
}
console.error(`\n✗ 문서 검사 실패 — ${problems.length}건\n`);
for (const { what, how } of problems) {
  console.error(`  ✗ ${what}`);
  console.error(`  → ${how}\n`);
}
console.error('규칙의 근거: docs/exec-plans/active/001-harness-engineering.md\n');
process.exit(1);
