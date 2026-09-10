#!/usr/bin/env node
// schema.prisma에서 요약 문서를 만든다.
//
// 왜: 에이전트가 데이터 모델을 알아야 할 때마다 237줄짜리 스키마 전문을 읽으면
// 컨텍스트를 크게 쓴다. 모델 이름·필드·관계만 추린 표가 있으면 대부분의 질문은
// 그걸로 끝나고, 정말 필요할 때만 원본을 연다.
//
// 이 문서는 손으로 고치지 않는다. 스키마를 고치고 `pnpm db:schema:doc`을 다시 돌린다.
// 어긋나면 `pnpm check:docs`가 막는다.

import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = join(ROOT, 'apps/api/prisma/schema.prisma');
const OUT = join(ROOT, 'docs/generated/db-schema.md');

/** 스키마 내용의 해시. 문서가 최신인지 판정하는 기준이 된다 (mtime은 체크아웃마다 바뀐다). */
export function schemaHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

const source = readFileSync(SCHEMA, 'utf8');

/** `enum 이름 { ... }` 블록을 뽑는다. */
function parseEnums(text) {
  const out = [];
  for (const m of text.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
    const values = m[2]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'))
      .map((l) => {
        const [token, ...rest] = l.split('//');
        return { name: token.trim(), note: rest.join('//').trim() };
      })
      .filter((v) => v.name);
    out.push({ name: m[1], values });
  }
  return out;
}

/** `model 이름 { ... }` 블록을 뽑는다. */
function parseModels(text) {
  const out = [];
  for (const m of text.matchAll(/model\s+(\w+)\s*\{([^}]*)\}/g)) {
    const fields = [];
    for (const raw of m[2].split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      const [decl, ...noteParts] = line.split('//');
      const [name, type, ...attrs] = decl.trim().split(/\s+/);
      if (!name || !type) continue;
      fields.push({
        name,
        type,
        attrs: attrs.join(' '),
        note: noteParts.join('//').trim(),
      });
    }
    out.push({ name: m[1], fields });
  }
  return out;
}

const enums = parseEnums(source);
const models = parseModels(source);

/** 관계 필드(다른 모델을 가리키는 것)와 스칼라를 나눈다. */
const modelNames = new Set(models.map((m) => m.name));
const isRelation = (f) => modelNames.has(f.type.replace(/[[\]?]/g, ''));

const lines = [
  '# 데이터 모델 요약',
  '',
  '<!-- 이 파일은 `pnpm db:schema:doc`이 만든다. 손으로 고치지 말 것. -->',
  `<!-- schema-hash: ${schemaHash(source)} -->`,
  '',
  '정본은 [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)다.',
  '이 문서는 모델·필드·관계만 추린 요약이라, 인덱스나 제약 같은 세부는 원본을 봐야 한다.',
  '',
  `모델 ${models.length}개 · Enum ${enums.length}개`,
  '',
  '## Enum',
  '',
];

for (const e of enums) {
  const rendered = e.values
    .map((v) => (v.note ? `\`${v.name}\`(${v.note})` : `\`${v.name}\``))
    .join(' · ');
  lines.push(`- **${e.name}** — ${rendered}`);
}

lines.push('', '## 모델', '');

for (const m of models) {
  lines.push(`### ${m.name}`, '');
  const scalars = m.fields.filter((f) => !isRelation(f));
  const relations = m.fields.filter(isRelation);

  lines.push('| 필드 | 타입 | 비고 |', '|---|---|---|');
  for (const f of scalars) {
    const attrs = f.attrs ? ` ${f.attrs}` : '';
    lines.push(`| \`${f.name}\` | \`${f.type}\`${attrs} | ${f.note} |`);
  }
  lines.push('');

  if (relations.length) {
    lines.push(
      `관계: ${relations.map((f) => `\`${f.name}\` → ${f.type}`).join(' · ')}`,
      '',
    );
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n');
console.log(`✓ ${OUT.replace(ROOT + '/', '')} 생성 (모델 ${models.length} · enum ${enums.length})`);
