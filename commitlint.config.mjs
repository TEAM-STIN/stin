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
    // deps/deps-dev는 Dependabot이 만드는 스코프다 (.github/dependabot.yml).
    'scope-enum': [2, 'always', ['web', 'api', 'types', 'docs', 'infra', 'deps', 'deps-dev']],
    'header-max-length': [2, 'always', 72],
    // 설명은 한국어로 쓴다. 영어 대소문자 규칙을 적용하지 않는다.
    'subject-case': [0],
  },
  // Dependabot이 만드는 커밋은 기계 생성이라 사람용 길이 규칙에서 제외한다.
  // 패키지 이름이 길면 72자를 넘는데, 그것 때문에 보안 패치가 막히면 본말전도다.
  // 형식(type·scope) 검사는 그대로 적용된다 — 여기서 빠지는 건 길이뿐이다.
  ignores: [(message) => /^(fix|chore)\(deps(-dev)?\): bump /.test(message)],
};
