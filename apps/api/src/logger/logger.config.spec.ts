import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';
import pino from 'pino';
import {
  REDACT_PATHS,
  REQUEST_ID_HEADER,
  resolveLogLevel,
  resolveRequestId,
} from './logger.config';

function fakeReq(headers: IncomingMessage['headers'] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

function fakeRes(statusCode = 200) {
  const headers: Record<string, unknown> = {};
  return {
    statusCode,
    setHeader: (name: string, value: unknown) => {
      headers[name] = value;
    },
    headers,
  } as unknown as ServerResponse & { headers: Record<string, unknown> };
}

describe('resolveRequestId', () => {
  it('들어온 x-request-id를 그대로 이어받는다', () => {
    const res = fakeRes();
    const id = resolveRequestId(
      fakeReq({ [REQUEST_ID_HEADER]: 'from-web-123' }),
      res,
    );
    expect(id).toBe('from-web-123');
  });

  it('헤더가 없으면 새 ID를 만든다', () => {
    const id = resolveRequestId(fakeReq(), fakeRes());
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('응답에도 같은 ID를 실어 보낸다', () => {
    const res = fakeRes();
    const id = resolveRequestId(fakeReq(), res);
    expect(res.headers[REQUEST_ID_HEADER]).toBe(id);
  });

  it('헤더가 배열로 오면 첫 값을 쓴다', () => {
    const id = resolveRequestId(
      fakeReq({ [REQUEST_ID_HEADER]: ['first', 'second'] }),
      fakeRes(),
    );
    expect(id).toBe('first');
  });

  it('빈 문자열이면 새로 만든다 (빈 ID로 추적이 끊기는 걸 막는다)', () => {
    const id = resolveRequestId(
      fakeReq({ [REQUEST_ID_HEADER]: '  ' }),
      fakeRes(),
    );
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('resolveLogLevel', () => {
  it.each([
    [200, 'info'],
    [301, 'info'],
    [400, 'warn'],
    [404, 'warn'],
    [500, 'error'],
  ])('상태 코드 %i는 %s', (status, expected) => {
    expect(resolveLogLevel(fakeReq(), fakeRes(status))).toBe(expected);
  });

  it('에러가 있으면 상태 코드와 무관하게 error다', () => {
    expect(resolveLogLevel(fakeReq(), fakeRes(200), new Error('터짐'))).toBe(
      'error',
    );
  });
});

describe('비밀값 마스킹', () => {
  /** 에이전트가 로그를 읽는다 = 로그가 모델 컨텍스트로 올라간다. 새면 안 된다. */
  function logAndCapture(payload: Record<string, unknown>): string {
    let captured = '';
    const sink = new Writable({
      write(chunk, _enc, cb) {
        captured += String(chunk);
        cb();
      },
    });
    const logger = pino(
      { redact: { paths: REDACT_PATHS, censor: '[가림]' } },
      sink,
    );
    logger.info(payload, 'test');
    return captured;
  }

  it('Authorization 헤더를 가린다', () => {
    const out = logAndCapture({
      req: { headers: { authorization: 'Bearer 진짜토큰' } },
    });
    expect(out).not.toContain('진짜토큰');
    expect(out).toContain('[가림]');
  });

  it('쿠키를 가린다', () => {
    const out = logAndCapture({ req: { headers: { cookie: 'sid=비밀' } } });
    expect(out).not.toContain('sid=비밀');
  });

  it.each(['password', 'accessToken', 'refreshToken', 'token', 'email'])(
    '%s 필드를 가린다',
    (field) => {
      const out = logAndCapture({ body: { [field]: '노출되면안됨' } });
      expect(out).not.toContain('노출되면안됨');
    },
  );

  it('가려야 할 것 외에는 남긴다', () => {
    const out = logAndCapture({ body: { nickname: '무겸', skinType: 'OILY' } });
    expect(out).toContain('무겸');
    expect(out).toContain('OILY');
  });
});
