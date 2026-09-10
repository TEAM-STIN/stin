import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

/**
 * 자주 나오는 실패에 "어떻게 고치는지"를 붙인다.
 *
 * 린트 에러에 수정 지침을 넣는 것과 같은 원칙이다. 에이전트는 로그만 읽고
 * 다음 행동을 정해야 하는데, 코드만 던지면 매번 검색부터 해야 한다.
 */
const REMEDIATION: Record<string, string> = {
  P2002:
    'unique 제약 위반. 충돌 필드는 meta.target 참조. ' +
    '서비스 레이어에서 중복 검사를 선행하거나 upsert로 바꾸세요. ' +
    '스키마: apps/api/prisma/schema.prisma',
  P2003:
    'foreign key 제약 위반. 참조하는 행이 실제로 있는지 확인하세요. ' +
    '시드 데이터 누락일 수 있습니다: apps/api/prisma/seed.ts',
  P2025:
    '대상 레코드가 없습니다. findUnique 결과를 확인하지 않고 update/delete를 ' +
    '호출했을 가능성이 큽니다. 존재 여부를 먼저 검사하세요.',
  P1001:
    'DB에 연결할 수 없습니다. `docker compose up -d`로 컨테이너가 떠 있는지, ' +
    'apps/api/.env의 DATABASE_URL이 맞는지 확인하세요.',
};

interface PrismaLikeError {
  code?: unknown;
  meta?: unknown;
}

function prismaCodeOf(exception: unknown): string | undefined {
  const code = (exception as PrismaLikeError | null)?.code;
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const prismaCode = prismaCodeOf(exception);
    const remediation = prismaCode ? REMEDIATION[prismaCode] : undefined;

    // 404·400을 error로 남기면 `pnpm logs:errors`가 그것들로 뒤덮여
    // 진짜 서버 에러가 묻힌다. 레벨은 상태 코드를 따른다.
    const log = status >= 500 ? 'error' : 'warn';

    this.logger[log](
      {
        err: exception,
        path: request.url,
        method: request.method,
        statusCode: status,
        ...(prismaCode ? { prismaCode } : {}),
        // 에이전트가 로그만 읽고 다음 행동을 정할 수 있게 처방을 함께 남긴다.
        ...(remediation ? { remediation } : {}),
      },
      exception instanceof Error ? exception.message : '알 수 없는 예외',
    );

    // 응답 본문에는 처방을 넣지 않는다. 내부 구조를 밖으로 흘리지 않기 위해서다.
    response.status(status).json({
      statusCode: status,
      path: request.url,
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : '서버 오류가 발생했습니다',
    });
  }
}
