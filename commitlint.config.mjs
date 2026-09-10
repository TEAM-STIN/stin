// 커밋 규칙의 정본은 docs/conventions.md다. 여기는 그것을 기계가 검사하는 형태로 옮긴 것이다.
// 규칙을 바꿀 때는 두 곳을 함께 고친다.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'ci', 'build', 'perf'],
    ],
    'scope-enum': [2, 'always', ['web', 'api', 'types', 'docs', 'infra']],
    'header-max-length': [2, 'always', 72],
    // 설명은 한국어로 쓴다. 영어 대소문자 규칙을 적용하지 않는다.
    'subject-case': [0],
  },
};
