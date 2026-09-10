import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // 이 패키지는 프론트·백이 공유하는 "계약"만 담는다.
      // 형태가 흔들리면 양쪽이 조용히 어긋나므로 표기를 강하게 고정한다.
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-duplicate-enum-values': 'error',
    },
  },
);
