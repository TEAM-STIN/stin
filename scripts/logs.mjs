#!/usr/bin/env node
// 로그 조회 도구.
//
// 왜 필요한가: `cat .logs/api.jsonl`은 답이 아니다. 몇 분만 돌아도 수만 줄이 되고,
// 에이전트가 그걸 통째로 읽으면 컨텍스트가 터져서 정작 원인을 놓친다.
// 필요한 줄만 뽑아 읽을 수 있어야 로그가 실제로 쓰인다.
//
// jq 대신 Node로 쓴 이유: jq는 macOS 기본 설치가 아니다. Node는 이 레포가
// 이미 요구한다(engines: node >= 24). 팀원이 도구를 따로 깔지 않아도 되게 한다.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOG_FILE = process.env.LOG_FILE
  ? resolve(process.env.LOG_FILE)
  : join(ROOT, '.logs', 'api.jsonl');

const SLOW_MS = Number(process.env.SLOW_MS ?? 500);
const LEVELS = { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' };

const [mode, ...args] = process.argv.slice(2);

function readEntries() {
  if (!existsSync(LOG_FILE)) {
    console.error(`✗ 로그 파일이 없습니다: ${LOG_FILE}`);
    console.error('  → API 개발 서버를 먼저 띄우세요: pnpm --filter api start:dev');
    console.error('    로그는 서버가 부팅될 때 새로 만들어집니다.');
    process.exit(1);
  }
  return readFileSync(LOG_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null; // 쓰는 도중 잘린 마지막 줄
      }
    })
    .filter(Boolean);
}

/** 요청 ID는 pino-http가 req.id에, 우리 로거가 reqId에 넣는다. 둘 다 본다. */
const reqIdOf = (e) => e.req?.id ?? e.reqId ?? null;

function format(e) {
  const time = e.time ? new Date(e.time).toISOString().slice(11, 23) : '??';
  const level = (LEVELS[e.level] ?? e.level ?? '?').toUpperCase().padEnd(5);
  const id = reqIdOf(e);
  const head = `${time} ${level} ${id ? `[${String(id).slice(0, 8)}] ` : ''}`;

  const parts = [];
  if (e.req) parts.push(`${e.req.method} ${e.req.url}`);
  if (e.res?.statusCode) parts.push(`→ ${e.res.statusCode}`);
  if (e.statusCode && !e.res) parts.push(`→ ${e.statusCode}`);
  if (typeof e.durationMs === 'number') parts.push(`${Math.round(e.durationMs)}ms`);
  if (e.query) parts.push(`SQL ${e.query}`);
  if (e.msg && !parts.length) parts.push(e.msg);
  else if (e.msg && e.msg !== 'request completed') parts.push(`· ${e.msg}`);

  let out = head + parts.join(' ');
  if (e.remediation) out += `\n${' '.repeat(14)}→ ${e.remediation}`;
  if (e.err?.stack) {
    const stack = e.err.stack.split('\n').slice(0, 4).join('\n');
    out += `\n${stack.replace(/^/gm, ' '.repeat(14))}`;
  }
  return out;
}

const entries = readEntries();
let picked;
let title;

switch (mode) {
  case 'errors':
    picked = entries.filter((e) => (e.level ?? 0) >= 50);
    title = `에러 ${picked.length}건`;
    break;
  case 'req': {
    const id = args[0];
    if (!id) {
      console.error('✗ 요청 ID가 필요합니다: pnpm logs:req <requestId>');
      console.error('  → ID는 `pnpm logs:errors`나 응답의 x-request-id 헤더에서 얻습니다.');
      process.exit(1);
    }
    picked = entries.filter((e) => String(reqIdOf(e) ?? '').startsWith(id));
    title = `요청 ${id} — ${picked.length}줄`;
    break;
  }
  case 'slow':
    picked = entries.filter((e) => typeof e.durationMs === 'number' && e.durationMs > SLOW_MS);
    title = `${SLOW_MS}ms 초과 ${picked.length}건`;
    break;
  case 'tail':
    picked = entries.slice(-Number(args[0] ?? 50));
    title = `최근 ${picked.length}줄`;
    break;
  default:
    console.error('사용법:');
    console.error('  pnpm logs:errors          에러만 (스택 포함)');
    console.error('  pnpm logs:req <id>        그 요청의 전 생애 (HTTP → SQL → 응답)');
    console.error('  pnpm logs:slow            느린 요청만 (기본 500ms 초과)');
    console.error('  pnpm logs:tail [n]        최근 n줄 (기본 50)');
    process.exit(1);
}

console.log(`\n── ${title}  (${LOG_FILE})\n`);
if (!picked.length) {
  console.log('  해당하는 로그가 없습니다.');
  if (mode === 'req') console.log('  → ID 앞부분만 입력해도 됩니다. `pnpm logs:tail`로 ID를 확인하세요.');
} else {
  for (const e of picked) console.log(format(e));
}
console.log('');
