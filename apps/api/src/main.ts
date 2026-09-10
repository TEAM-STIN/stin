import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs: 부팅 중 로그를 모아뒀다가 pino가 준비되면 한꺼번에 내보낸다.
  // 이게 없으면 초기 로그만 Nest 기본 로거 형식으로 섞여 파싱이 깨진다.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3001);
}
// eslint no-floating-promises: 최상위 호출이라 대기할 곳이 없다. 의도된 fire-and-forget.
void bootstrap();
