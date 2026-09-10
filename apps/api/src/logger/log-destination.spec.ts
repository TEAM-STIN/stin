import { existsSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  prepareLogFile,
  resolveLogFile,
  truncateIfTooLarge,
} from './log-destination';

describe('resolveLogFile', () => {
  const original = process.env.LOG_FILE;
  afterEach(() => {
    if (original === undefined) delete process.env.LOG_FILE;
    else process.env.LOG_FILE = original;
  });

  it('LOG_FILE이 있으면 그 경로를 쓴다', () => {
    process.env.LOG_FILE = '/tmp/custom.jsonl';
    expect(resolveLogFile()).toBe('/tmp/custom.jsonl');
  });

  it.each(['', '   '])('LOG_FILE이 %p면 설정 안 한 것으로 본다', (raw) => {
    process.env.LOG_FILE = raw;
    expect(resolveLogFile()).toMatch(/\.logs\/api\.jsonl$/);
  });

  it('기본값은 레포 루트의 .logs/api.jsonl이다', () => {
    delete process.env.LOG_FILE;
    // cwd가 apps/api여도 레포 루트를 찾아야 한다.
    expect(resolveLogFile()).toMatch(/\.logs\/api\.jsonl$/);
    expect(resolveLogFile()).not.toContain('apps/api/.logs');
  });
});

describe('prepareLogFile', () => {
  it('디렉터리가 없으면 만든다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stin-log-'));
    const path = join(dir, 'nested', 'api.jsonl');

    prepareLogFile(path);

    expect(existsSync(join(dir, 'nested'))).toBe(true);
  });

  it('기존 로그를 비운다 (세션마다 깨끗한 로그)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stin-log-'));
    const path = join(dir, 'api.jsonl');
    writeFileSync(path, '지난 세션의 로그\n'.repeat(100));

    prepareLogFile(path);

    expect(statSync(path).size).toBe(0);
  });
});

describe('truncateIfTooLarge', () => {
  it('작은 파일은 건드리지 않는다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stin-log-'));
    const path = join(dir, 'api.jsonl');
    writeFileSync(path, 'x'.repeat(1024));

    expect(truncateIfTooLarge(path)).toBe(false);
    expect(statSync(path).size).toBe(1024);
  });

  it('없는 파일에는 아무것도 하지 않는다', () => {
    expect(truncateIfTooLarge('/tmp/없는파일-stin.jsonl')).toBe(false);
  });
});
