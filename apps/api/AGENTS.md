# apps/api

NestJS 11 + Prisma 7 + PostgreSQL. 루트 [`AGENTS.md`](../../AGENTS.md)를 먼저 읽는다.
여기에는 이 패키지에만 해당하는 것만 적는다.

## Prisma 7 주의 (학습 데이터와 다름)

- **`schema.prisma`에 `datasource.url`을 쓸 수 없다.** Prisma 7에서 제거됐다.
  - CLI용 연결 문자열: `prisma.config.ts`
  - 런타임: `@prisma/adapter-pg` 드라이버 어댑터 (`src/prisma/prisma.service.ts`)
  - 둘 다 `apps/api/.env`의 `DATABASE_URL`을 공유해서 읽는다
- 배경은 [`docs/architecture.md`](../../docs/architecture.md)에 기록돼 있다
- 기억과 다르면 추측하지 말고 `node_modules/prisma`의 타입과
  [`docs/references/`](../../docs/references/)를 확인한다

## 스키마 변경

1. `prisma/schema.prisma` 수정
2. `pnpm --filter api exec prisma migrate dev --name <설명>`
3. 마이그레이션 SQL을 **읽어보고** 의도대로 나왔는지 확인한다 (파괴적 변경 주의)
4. 시드가 영향을 받으면 `prisma/seed.ts`도 함께 고친다
5. 마이그레이션 파일은 **커밋한다.** 손으로 고치지 않는다

기존 마이그레이션을 수정하거나 삭제하지 않는다. 되돌리려면 새 마이그레이션을 만든다.

## 성분·루틴 도메인

성분 병용 규칙과 고민 매핑은 **개별 성분이 아니라 `IngredientGroup` 단위**로 건다.
배경은 [`docs/golden-rules.md`](../../docs/golden-rules.md) 4번.

추천 엔진 처리 흐름은 [`docs/architecture.md`](../../docs/architecture.md)의
"추천 엔진 처리 흐름" 참조. 이 흐름을 바꾸면 그 문서도 함께 고친다.

## 테스트

Jest. `src/**/*.spec.ts`가 단위, `test/*.e2e-spec.ts`가 E2E.

추천 엔진과 성분 병용 규칙 검증은 **테스트 필수 영역**이다 —
[`docs/testing.md`](../../docs/testing.md).

## 환경변수

`.env`는 커밋하지 않는다. 새 변수를 추가하면 **`.env.example`에 반드시 함께 추가**한다.
값 없이 키와 한 줄 설명만.

## 로깅

`nestjs-pino`를 쓴다. `console.log`나 Nest 기본 `Logger`를 쓰지 않는다 —
JSON 구조가 깨져서 `pnpm logs:*`가 읽지 못한다.

```ts
constructor(@InjectPinoLogger(MyService.name) private readonly logger: PinoLogger) {}
// this.logger.info({ productId, stepCount }, '루틴 추천 생성');
```

- **첫 인자는 객체, 둘째가 메시지다.** 값을 문자열에 끼워 넣지 말고 필드로 남긴다.
  그래야 나중에 그 필드로 걸러낼 수 있다
- 요청 안에서 찍으면 `requestId`가 자동으로 붙는다. 직접 넣지 않는다
- 비밀값은 [`logger.config.ts`](src/logger/logger.config.ts)의 `REDACT_PATHS`가 가린다.
  **새 비밀 필드를 만들면 거기에 추가한다**
- 자주 나오는 실패의 수정 지침은
  [`all-exceptions.filter.ts`](src/common/all-exceptions.filter.ts)의 `REMEDIATION`에 있다.
  같은 에러로 두 번 헤맸다면 거기에 항목을 추가한다
