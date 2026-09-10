import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countCheckboxes,
  daysSince,
  hasSiblingTest,
  parseDebtRows,
  staleDebt,
} from './gardening.mjs';

describe('parseDebtRows', () => {
  const md = `# 트래커

## 미해결

| 발견일 | 영역 | 내용 | 크기 |
|---|---|---|---|
| 2026-09-10 | api | postinstall이 DATABASE_URL을 요구한다 | S |
| 2026-08-01 | web | 낡은 항목 | M |

크기: S = 30분 이내

## 해결

| 발견일 | 해결일 | 내용 |
|---|---|---|
| 2026-09-10 | 2026-09-10 | 이건 세면 안 된다 |
`;

  it('미해결 표의 행만 뽑는다', () => {
    const rows = parseDebtRows(md);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].area, 'api');
  });

  it('해결 표는 세지 않는다', () => {
    assert.ok(!parseDebtRows(md).some((r) => r.what.includes('세면 안 된다')));
  });

  it('헤더 행과 구분선은 세지 않는다', () => {
    assert.ok(!parseDebtRows(md).some((r) => r.area === '영역'));
  });

  it('미해결 절이 없으면 빈 배열', () => {
    assert.deepEqual(parseDebtRows('# 아무것도 없음'), []);
  });
});

describe('daysSince', () => {
  it('같은 날은 0일', () => {
    assert.equal(daysSince('2026-09-10', '2026-09-10'), 0);
  });

  it('달을 넘어도 정확히 센다', () => {
    assert.equal(daysSince('2026-08-01', '2026-09-10'), 40);
  });
});

describe('staleDebt', () => {
  const rows = [
    { date: '2026-09-10', area: 'api', what: '어제 것', size: 'S' },
    { date: '2026-08-01', area: 'web', what: '오래된 것', size: 'M' },
  ];

  it('기준을 넘긴 것만 남긴다', () => {
    const stale = staleDebt(rows, '2026-09-10', 30);
    assert.equal(stale.length, 1);
    assert.equal(stale[0].what, '오래된 것');
  });

  it('오래된 순으로 정렬한다', () => {
    const many = [
      { date: '2026-08-20', what: '중간', area: 'a', size: 'S' },
      { date: '2026-01-01', what: '가장 오래', area: 'a', size: 'S' },
    ];
    assert.equal(staleDebt(many, '2026-09-10', 10)[0].what, '가장 오래');
  });

  it('경계값(정확히 기준일)도 포함한다', () => {
    assert.equal(staleDebt([{ date: '2026-08-11', what: 'x', area: 'a', size: 'S' }], '2026-09-10', 30).length, 1);
  });
});

describe('countCheckboxes', () => {
  it('완료·미완료를 센다', () => {
    const r = countCheckboxes('- [x] 하나\n- [x] 둘\n- [ ] 셋');
    assert.deepEqual({ done: r.done, open: r.open }, { done: 2, open: 1 });
  });

  it('전부 끝났으면 complete', () => {
    assert.equal(countCheckboxes('- [x] 하나\n- [x] 둘').complete, true);
  });

  it('하나라도 남으면 complete가 아니다', () => {
    assert.equal(countCheckboxes('- [x] 하나\n- [ ] 둘').complete, false);
  });

  it('체크박스가 아예 없으면 complete가 아니다 (빈 문서를 완료로 보지 않는다)', () => {
    assert.equal(countCheckboxes('# 제목만 있음').complete, false);
  });
});

describe('hasSiblingTest', () => {
  it('.spec.ts 짝을 찾는다', () => {
    assert.equal(
      hasSiblingTest('/a/b/routine.service.ts', ['/a/b/routine.service.spec.ts']),
      true,
    );
  });

  it('.test.tsx 짝을 찾는다', () => {
    assert.equal(hasSiblingTest('/a/b/card.tsx', ['/a/b/card.test.tsx']), true);
  });

  it('짝이 없으면 false', () => {
    assert.equal(hasSiblingTest('/a/b/x.ts', ['/a/b/y.spec.ts']), false);
  });

  it('이름이 앞부분만 겹치는 파일에 속지 않는다', () => {
    assert.equal(
      hasSiblingTest('/a/b/routine.ts', ['/a/b/routine-step.spec.ts']),
      false,
    );
  });
});
