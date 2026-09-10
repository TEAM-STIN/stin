import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** 파일 하나가 이 크기를 넘으면 비운다. 에이전트가 읽을 수 없을 만큼 커지는 걸 막는다. */
const MAX_LOG_BYTES = 50 * 1024 * 1024;

/**
 * 레포 루트를 찾는다. `pnpm --filter api start:dev`는 cwd가 apps/api라서
 * cwd 기준으로 잡으면 로그가 엉뚱한 곳에 쌓인다.
 */
function findRepoRoot(from: string): string {
  let dir = from;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return from; // 못 찾으면 시작 지점을 쓴다
    dir = parent;
  }
}

/** JSON Lines 로그 파일의 절대 경로. LOG_FILE로 덮어쓸 수 있다. */
export function resolveLogFile(): string {
  // 빈 문자열·공백은 "설정 안 함"으로 본다 (.env에 `LOG_FILE=`만 적힌 경우).
  const configured = process.env.LOG_FILE?.trim();
  if (configured) return resolve(configured);
  return join(findRepoRoot(__dirname), '.logs', 'api.jsonl');
}

/**
 * 부팅할 때 로그를 비운다.
 *
 * 왜 비우나: 에이전트가 로그를 읽는 것이 목적인데, 지난 세션의 로그가 섞여 있으면
 * "지금 이 실행에서 무슨 일이 있었나"를 가려내는 데 컨텍스트를 낭비한다.
 * 세션 단위로 깨끗한 로그가 진단에 유리하다.
 *
 * 프로덕션에서는 호출하지 않는다 (stdout만 쓰므로 파일 자체가 없다).
 */
export function prepareLogFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) return;
  writeFileSync(path, '');
}

/** 프로덕션 등 비우지 않는 경로에서, 파일이 너무 커졌으면 그때만 비운다. */
export function truncateIfTooLarge(path: string): boolean {
  if (!existsSync(path)) return false;
  if (statSync(path).size <= MAX_LOG_BYTES) return false;
  writeFileSync(path, '');
  return true;
}
