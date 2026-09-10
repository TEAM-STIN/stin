import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs: 부팅 중 로그를 모아뒀다가 pino가 준비되면 한꺼번에 내보낸다.
  // 이게 없으면 초기 로그만 Nest 기본 로거 형식으로 섞여 파싱이 깨진다.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // API_PORT를 먼저 본다. worktree를 여러 개 띄울 때 각자 다른 포트를 받는다
  // (scripts/worktree-up.sh가 정해준다). PORT는 배포 환경 호환용.
  // ??가 아니라 ||를 쓴다. `.env`에 `API_PORT=`만 적히면 빈 문자열이 들어오고
  // listen('')은 임의 포트로 뜬다 — 조용히 잘못되는 쪽이라 더 나쁘다.
  const port = process.env.API_PORT?.trim() || process.env.PORT?.trim() || 3001;
  await app.listen(port);
}
// eslint no-floating-promises: 최상위 호출이라 대기할 곳이 없다. 의도된 fire-and-forget.
void bootstrap();
