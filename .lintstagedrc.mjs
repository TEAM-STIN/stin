// 스테이지된 파일에만 린트를 건다. 전체 검증은 pre-push와 CI가 맡는다.
const eslintIn = (filter) => (files) =>
  `pnpm --filter ${filter} exec eslint --fix --max-warnings 0 ${files.map((f) => JSON.stringify(f)).join(' ')}`;

export default {
  'apps/web/**/*.{ts,tsx}': eslintIn('web'),
  'apps/api/**/*.ts': eslintIn('api'),
  'packages/types/**/*.ts': eslintIn('@stin/types'),
  // 문서는 개별 파일이 아니라 문서 전체의 정합성을 본다 (링크·고아 문서·목차 크기).
  '**/*.md': () => 'node scripts/check-docs.mjs',
};
