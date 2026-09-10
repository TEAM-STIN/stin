import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { prepareLogFile, resolveLogFile } from './log-destination';

/** 요청을 식별하는 헤더. 프론트가 붙여 보내면 그 값을 그대로 이어받는다. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** 이 시간을 넘긴 요청은 warn으로 올린다. `pnpm logs:slow`가 이걸 본다. */
export const SLOW_REQUEST_MS = 500;

/**
 * 로그에서 가려야 하는 경로.
 *
 * 에이전트가 로그를 읽는다는 것은 로그 내용이 모델 컨텍스트로 올라간다는 뜻이다.
 * 소셜 로그인(JWT)과 리뷰(이메일)가 들어오면 그대로 새어나간다.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.token',
  '*.email',
];

/**
 * 요청 ID를 정한다.
 *
 * 들어온 x-request-id가 있으면 그대로 쓴다 — 그래야 프론트에서 시작된 요청 하나를
 * 브라우저부터 DB까지 같은 ID로 따라갈 수 있다. 없으면 새로 만든다.
 * 응답에도 같은 값을 실어 보내 호출한 쪽이 ID를 알 수 있게 한다.
 */
export function resolveRequestId(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    (Array.isArray(incoming) ? incoming[0] : incoming)?.trim() || randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

/** 느린 요청과 에러를 레벨로 구분한다. 조회 스크립트가 레벨로 필터링한다. */
export function resolveLogLevel(
  _req: IncomingMessage,
  res: ServerResponse,
  err?: Error,
): 'error' | 'warn' | 'info' {
  if (err || res.statusCode >= 500) return 'error';
  if (res.statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * 로그 레벨을 정한다.
 *
 * `??`가 아니라 `||`를 쓰는 이유: `.env`에 `LOG_LEVEL=`처럼 값 없이 키만 적히면
 * 빈 문자열이 들어온다. `??`는 빈 문자열을 통과시키고, pino는
 * "default level: must be included in custom levels"로 부팅에 실패한다.
 * .env.example을 복사한 사람이 곧바로 겪는 문제라 방어한다.
 */
export function resolveLevel(
  raw: string | undefined,
  isProduction: boolean,
): string {
  return raw?.trim() || (isProduction ? 'info' : 'debug');
}

export function buildLoggerParams(): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const level = resolveLevel(process.env.LOG_LEVEL, isProduction);

  // 프로덕션은 stdout JSON만 쓴다. Docker의 json-file 드라이버가 받는다.
  // 개발에서는 사람용(pretty)과 에이전트용(JSON Lines 파일)을 동시에 쓴다.
  const logFile = isProduction ? null : resolveLogFile();
  if (logFile) prepareLogFile(logFile);

  return {
    pinoHttp: {
      level,
      genReqId: resolveRequestId,
      customLogLevel: resolveLogLevel,
      // responseTime을 durationMs로 바꿔 조회 스크립트와 이름을 맞춘다.
      customAttributeKeys: { responseTime: 'durationMs' },
      redact: { paths: REDACT_PATHS, censor: '[가림]' },
      transport: logFile
        ? {
            targets: [
              {
                target: 'pino-pretty',
                level,
                options: { singleLine: true, translateTime: 'HH:MM:ss.l' },
              },
              {
                target: 'pino/file',
                level,
                options: { destination: logFile, mkdir: true },
              },
            ],
          }
        : undefined,
    },
  };
}
