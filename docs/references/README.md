# 외부 레퍼런스

STIN이 쓰는 프레임워크 중 **에이전트 학습 데이터보다 최신인 것들**의 요약을 둔다.

여기 있는 문서는 우리가 쓴 것이 아니라 외부 사실의 사본이다. 규칙이 아니라 참조다.

## 왜 필요한가

Next 16 · Prisma 7 · NestJS 11은 모두 파괴적 변경을 포함한 최신 버전이다. 에이전트가
기억에 의존하면 존재하지 않는 API를 쓴다. 실제로 Prisma 7에서 `datasource.url`이
제거된 건은 이미 사고로 겪었고 [architecture.md](../architecture.md)에 기록돼 있다.

## 채울 파일

- [ ] `prisma7-llms.txt` — Prisma 7 변경점 (특히 `prisma.config.ts`, 드라이버 어댑터)
- [ ] `nextjs16-llms.txt` — Next.js 16 변경점
- [ ] `nestjs11-llms.txt` — NestJS 11 변경점

공식 `llms.txt`가 있으면 그대로 받고, 없으면 릴리스 노트·마이그레이션 가이드에서
**우리가 실제로 쓰는 범위만** 추려서 적는다. 전문을 통째로 넣지 않는다 — 컨텍스트 낭비다.

## 1차 소스

`node_modules/`의 실제 타입 정의가 항상 최종 근거다. `apps/web`의 경우
`node_modules/next/dist/docs/`에 번들된 가이드가 있다 ([apps/web/AGENTS.md](../../apps/web/AGENTS.md) 참조).
