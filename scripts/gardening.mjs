#!/usr/bin/env node
// 정기 정리. 드리프트가 쌓이기 전에 눈에 보이게 한다.
//
// 왜 필요한가: 에이전트는 레포에 이미 있는 패턴을 복제한다. 최적이 아닌 패턴도
// 그대로 번식하므로 드리프트는 필연이다. 원문 팀은 처음에 주 20%를 수동 정리에
// 썼고 그 방식은 확장되지 않았다. 2인 팀에 그만한 여유는 없으니, 사람이 몰아서
// 치우는 대신 "지금 뭐가 쌓였는지"를 기계가 먼저 뽑아준다.
//
// 이 스크립트는 아무것도 막지 않는다. 판단은 사람이 한다.
// 목표는 사람이 읽고 판단하는 시간을 10분 이내로 끝내는 것이다.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 기술 부채가 이 일수를 넘기면 들춰낸다. */
export const STALE_DEBT_DAYS = 30;
/** AGENTS.md가 상한의 이 비율을 넘으면 미리 알린다. */
const AGENTS_WARN_RATIO = 0.8;
const AGENTS_MAX_LINES = 100;

const read = (p) => readFileSync(p, 'utf8');
const rel = (p) => relative(ROOT, p);

// ── 순수 로직 (테스트 대상) ──────────────────────────────────────────────

/** tech-debt-tracker의 "미해결" 표에서 행을 뽑는다. */
export function parseDebtRows(markdown) {
  const section = markdown.split('## 미해결')[1]?.split('## 해결')[0] ?? '';
  const rows = [];
  for (const line of section.split('\n')) {
    const m = /^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*([SML])\s*\|$/.exec(
      line.trim(),
    );
    if (m) rows.push({ date: m[1], area: m[2], what: m[3], size: m[4] });
  }
  return rows;
}

/** 오늘 기준으로 며칠 지났는지. */
export function daysSince(date, today) {
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`);
  return Math.floor(ms / 86_400_000);
}

/** 방치 기준을 넘긴 항목만 남긴다. */
export function staleDebt(rows, today, maxDays = STALE_DEBT_DAYS) {
  return rows
    .map((r) => ({ ...r, age: daysSince(r.date, today) }))
    .filter((r) => r.age >= maxDays)
    .sort((a, b) => b.age - a.age);
}

/** 실행 계획의 체크박스를 센다. 전부 끝났으면 completed로 옮길 때다. */
export function countCheckboxes(markdown) {
  const done = (markdown.match(/^- \[x\]/gim) ?? []).length;
  const open = (markdown.match(/^- \[ \]/gim) ?? []).length;
  return { done, open, complete: open === 0 && done > 0 };
}

/** 소스 파일에 짝이 되는 테스트가 있는지. */
export function hasSiblingTest(file, siblings) {
  const base = file.replace(/\.(ts|tsx)$/, '');
  return siblings.some((s) => s === `${base}.spec.ts` || s === `${base}.test.ts` || s === `${base}.test.tsx`);
}

// ── 수집 ────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function main() {
  const today = process.env.GARDENING_TODAY ?? new Date().toISOString().slice(0, 10);
  const findings = [];
  const add = (title, items, hint) => {
    if (items.length) findings.push({ title, items, hint });
  };

  // 1. 오래 방치된 기술 부채
  const trackerPath = join(ROOT, 'docs/exec-plans/tech-debt-tracker.md');
  if (existsSync(trackerPath)) {
    const stale = staleDebt(parseDebtRows(read(trackerPath)), today);
    add(
      `${STALE_DEBT_DAYS}일 이상 방치된 기술 부채 ${stale.length}건`,
      stale.map((r) => `**${r.age}일** · ${r.area} · ${r.what.slice(0, 90)}`),
      '관련 영역을 작업할 때 같이 처리하거나, 안 할 거면 트래커에서 지우세요. ' +
        '남겨두기만 하면 목록이 배경 소음이 됩니다.',
    );
  }

  // 2. 끝났는데 active에 남은 실행 계획
  const activeDir = join(ROOT, 'docs/exec-plans/active');
  if (existsSync(activeDir)) {
    const done = readdirSync(activeDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ f, ...countCheckboxes(read(join(activeDir, f))) }))
      .filter((p) => p.complete);
    add(
      `완료됐는데 active에 남은 실행 계획 ${done.length}건`,
      done.map((p) => `\`${p.f}\` — 체크박스 ${p.done}개 전부 완료`),
      '`docs/exec-plans/completed/`로 옮기세요. active가 실제 진행 중인 것만 담아야 ' +
        '에이전트가 "지금 무슨 작업이 도는지"를 알 수 있습니다.',
    );
  }

  // 3. AGENTS.md가 상한에 근접
  const agentsPath = join(ROOT, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const lines = read(agentsPath).split('\n').length;
    if (lines > AGENTS_MAX_LINES * AGENTS_WARN_RATIO) {
      add(
        `AGENTS.md가 ${lines}줄 (상한 ${AGENTS_MAX_LINES})`,
        [`여유 ${AGENTS_MAX_LINES - lines}줄`],
        '아직 막히진 않지만 곧 넘칩니다. 가장 긴 섹션을 하위 문서로 옮기고 ' +
          '포인터만 남기세요. 넘긴 뒤에 급하게 쪼개면 구조가 나빠집니다.',
      );
    }
  }

  // 4. 채워지지 않은 참조 문서
  const refsPath = join(ROOT, 'docs/references/README.md');
  if (existsSync(refsPath)) {
    const { open } = countCheckboxes(read(refsPath));
    if (open) {
      add(
        `비어 있는 외부 레퍼런스 ${open}건`,
        ['`docs/references/`의 llms.txt가 아직 없습니다'],
        'Next 16·Prisma 7·NestJS 11은 학습 데이터보다 최신이라, 없으면 에이전트가 ' +
          '존재하지 않는 API를 씁니다. 이미 Prisma 7에서 한 번 겪었습니다.',
      );
    }
  }

  // 5. 짝이 되는 테스트가 없는 소스
  const sources = [
    ...walk(join(ROOT, 'apps/api/src')).filter((f) => /\.(service|controller)\.ts$/.test(f)),
    ...walk(join(ROOT, 'apps/web/components')).filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f)),
  ];
  const all = [...walk(join(ROOT, 'apps/api/src')), ...walk(join(ROOT, 'apps/web/components'))];
  const untested = sources.filter((f) => !hasSiblingTest(f, all));
  add(
    `짝이 되는 테스트가 없는 소스 ${untested.length}건`,
    untested.map((f) => `\`${rel(f)}\``),
    '전부 테스트해야 한다는 뜻은 아닙니다. `docs/testing.md`의 "테스트하지 않아도 ' +
      '되는 것"에 해당하면 그대로 두세요. 다만 추천 엔진·성분 병용 규칙은 필수입니다.',
  );

  // ── 출력 ────────────────────────────────────────────────────────────────

  if (!findings.length) {
    console.log(`## 정기 정리 — ${today}\n\n정리할 것이 없습니다. 🌱`);
    return;
  }

  const out = [`## 정기 정리 — ${today}`, ''];
  out.push('기계가 뽑은 것이고 아무것도 막지 않습니다. **판단은 사람이 합니다.**');
  out.push('읽고 결정하는 데 10분을 넘기지 마세요 — 넘기면 이 점검 자체가 부담이 됩니다.');
  out.push('');
  for (const { title, items, hint } of findings) {
    out.push(`### ${title}`, '');
    for (const i of items) out.push(`- ${i}`);
    out.push('', `> ${hint}`, '');
  }
  out.push('---', '');
  out.push('사람이 추가로 할 일: `/code-review`를 최근 변경 전체에 한 번 돌리고,');
  out.push('나올 만한 지적을 [tech-debt-tracker](docs/exec-plans/tech-debt-tracker.md)에 적재하세요.');
  out.push('같은 지적이 반복되면 규칙으로 승격합니다 — [workflow.md](docs/workflow.md)의 피드백 승격 규칙.');
  console.log(out.join('\n'));
}

// 직접 실행할 때만 돈다. 테스트에서 import할 때는 순수 함수만 가져간다.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
