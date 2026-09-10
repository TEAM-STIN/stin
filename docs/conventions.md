# 컨벤션

## 커밋 메시지

**Conventional Commits를 쓴다.** 타입·스코프는 영어, 설명은 한국어.

```
feat(web): 온보딩 피부타입 선택 화면 추가
fix(api): 추천 결과에서 중복 제품이 나오는 문제 수정
docs: 하네스 엔지니어링 문서 골격 추가
```

형식: `<타입>(<스코프>): <설명>` — 스코프는 생략 가능.

| 타입 | 쓸 때 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `refactor` | 동작 변화 없는 구조 변경 |
| `test` | 테스트 추가·수정 |
| `chore` | 의존성·설정 등 |
| `ci` | CI 설정 |
| `build` | 빌드 설정·번들 |
| `perf` | 성능 개선 |

스코프: `web` · `api` · `types` · `docs` · `infra`

규칙:
- 설명은 명령형 또는 평서형 한국어. 끝에 마침표를 찍지 않는다
- 제목 줄은 72자 이내
- **무엇을** 했는지만 제목에 쓰고, **왜** 했는지는 본문에 쓴다

> 2026년 9월 이전 커밋은 한국어 서술형(`~한다`)이다. 과거 커밋은 고치지 않고,
> 이 시점부터 적용한다.

## 브랜치

```
feat/<슬러그>      새 기능
fix/<슬러그>       버그 수정
docs/<슬러그>      문서
chore/<슬러그>     설정·의존성
```

이슈 번호가 있으면 `feat/18-design-system`처럼 앞에 붙인다.
`main`에 직접 push하지 않는다.

## PR

- 제목은 커밋 메시지와 같은 규칙
- 본문에 **exec-plan 링크**를 넣는다
- 하나의 PR은 하나의 목적만 담는다. 리팩터링과 기능 추가를 섞지 않는다
- CI가 green이어야 머지한다

## 네이밍

| 대상 | 규칙 | 예 |
|---|---|---|
| React 컴포넌트 파일 | kebab-case | `routine-step-card.tsx` |
| 컴포넌트 이름 | PascalCase | `RoutineStepCard` |
| 훅 | `use` 접두사 | `useRoutineDraft` |
| NestJS 파일 | `<이름>.<역할>.ts` | `routine.service.ts` |
| Prisma 모델 | PascalCase 단수 | `RoutineStep` |
| Prisma enum 값 | UPPER_SNAKE | `TROUBLE`, `AM` |
| 상수 | UPPER_SNAKE | `MAX_STEP_COUNT` |

컴포넌트 배치 규칙은 [design-system.md](design-system.md)의 "컴포넌트 규칙" 참조.
