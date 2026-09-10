# STIN

피부타입에 맞는 스킨케어 루틴을 단계별로 추천하고, 상품별 사용자 리뷰를 제공하는 서비스.

## 소개

<!-- TODO: 한두 문단으로 서비스 소개, 문제 인식, 핵심 차별점('스킨루틴 추천') -->

## 핵심 기능

<!-- TODO
- 온보딩 → 피부타입 기반 루틴 추천
- 성분 병용 규칙 검증 + 트레이드오프 처리
- 리뷰 (좋아요/아쉬워요 + 피부타입 필터)
-->

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| 프론트 | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| 백엔드 | NestJS 11, TypeScript |
| ORM / DB | Prisma, PostgreSQL |
| 인증 | JWT + Passport |
| 인프라 | AWS EC2, Nginx, Docker Compose |
| 모노레포 | pnpm workspace |

## 아키텍처

자세한 내용은 [`docs/architecture.md`](./docs/architecture.md) 참고.

## 로컬 실행 방법

```bash
# 먼저 환경변수 파일부터. 없으면 pnpm install이 실패한다
# (apps/api의 postinstall이 prisma generate를 돌리면서 DATABASE_URL을 요구한다)
cp .env.example .env
cp apps/api/.env.example apps/api/.env

pnpm install

# DB 실행
docker compose up -d

# 마이그레이션
pnpm --filter api exec prisma migrate dev

# 개발 서버
pnpm --filter web dev     # http://localhost:3000
pnpm --filter api start:dev  # http://localhost:3001
```

## 배포

<!-- TODO: EC2 배포 구성, README에 배포 URL 추가 예정 -->

## 프로젝트 구조

```
stin/
├── apps/
│   ├── web/       # Next.js
│   └── api/       # NestJS
├── packages/
│   └── types/     # 프론트·백엔드 공유 타입
└── docs/
    └── architecture.md
```
