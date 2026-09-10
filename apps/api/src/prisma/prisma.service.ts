import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client/index';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * 쿼리 이벤트는 항상 켜고, 구독만 개발에서 한다.
 *
 * `emit: 'event'`는 Prisma가 직접 출력하지 않고 이벤트만 발생시킨다는 뜻이라,
 * 구독하지 않으면 아무 비용이 없다. 설정 자체를 조건부로 만들면 $on의 타입이
 * never로 무너져서 이렇게 나눴다.
 */
const LOG_CONFIG = [
  { emit: 'event', level: 'query' },
  { emit: 'event', level: 'warn' },
  { emit: 'event', level: 'error' },
] satisfies { emit: 'event'; level: 'query' | 'warn' | 'error' }[];

/**
 * 쿼리 로그는 개발에서만 남긴다.
 *
 * 왜 필요한가: "왜 이 응답이 느린가" / "왜 빈 배열이 오나" 같은 질문은 SQL을 봐야
 * 답이 나온다. 쿼리 로그가 없으면 에이전트가 코드만 읽고 추측하게 된다.
 * 프로덕션에서는 끈다 — 양이 많고, 파라미터에 사용자 데이터가 섞인다.
 */
const LOG_QUERIES = process.env.NODE_ENV !== 'production';

/**
 * PrismaClient의 제네릭에 넘길 옵션 형태. $on의 이벤트 타입이 여기서 결정되므로
 * log를 반드시 포함해야 하고, 포함하는 순간 adapter도 함께 적어야 한다
 * (Subset 타입이 여기 적힌 키만 허용한다).
 */
type ClientOptions = {
  adapter: Prisma.PrismaClientOptions['adapter'];
  log: typeof LOG_CONFIG;
};

@Injectable()
export class PrismaService
  extends PrismaClient<ClientOptions>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      log: LOG_CONFIG,
    });
  }

  async onModuleInit() {
    if (LOG_QUERIES) this.subscribeToQueryEvents();
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * 쿼리 이벤트를 같은 로거로 흘려보낸다. 요청 컨텍스트 안에서 실행되면
   * pino가 같은 requestId를 붙이므로, `pnpm logs:req <id>`에 SQL까지 함께 나온다.
   */
  private subscribeToQueryEvents(): void {
    this.$on('query', (event) => {
      this.logger.debug(
        { query: event.query, durationMs: event.duration },
        'prisma query',
      );
    });
    this.$on('warn', (event) => this.logger.warn(event.message));
    this.$on('error', (event) => this.logger.error(event.message));
  }
}
