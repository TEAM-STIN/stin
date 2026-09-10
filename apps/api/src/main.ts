import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
// eslint no-floating-promises: 최상위 호출이라 대기할 곳이 없다. 의도된 fire-and-forget.
void bootstrap();
