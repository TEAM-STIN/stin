import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';

type LogPayload = Record<string, unknown>;
type ResponseBody = { statusCode: number; path: string; message: unknown };

function makeHost(url = '/routines/recommend', method = 'GET') {
  const json = jest.fn<void, [ResponseBody]>();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url, method }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function makeFilter() {
  const error = jest.fn<void, [LogPayload, string]>();
  const warn = jest.fn<void, [LogPayload, string]>();
  const logger = { error, warn } as unknown as PinoLogger;
  return { filter: new AllExceptionsFilter(logger), error, warn };
}

/** code를 가진 Prisma 스타일 에러를 만든다. */
function prismaError(code: string, message = '실패') {
  return Object.assign(new Error(message), { code });
}

describe('AllExceptionsFilter', () => {
  it('HttpException은 원래 상태 코드를 유지한다', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    filter.catch(new HttpException('없음', HttpStatus.NOT_FOUND), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, path: '/routines/recommend' }),
    );
  });

  it('알 수 없는 예외는 500으로 내리고 내부 메시지를 노출하지 않는다', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    filter.catch(new Error('DB 커넥션 문자열이 잘못됨'), host);

    expect(status).toHaveBeenCalledWith(500);
    const [body] = json.mock.calls[0];
    expect(body.message).toBe('서버 오류가 발생했습니다');
    expect(JSON.stringify(body)).not.toContain('커넥션 문자열');
  });

  it('Prisma 에러에는 수정 지침을 로그에 함께 남긴다', () => {
    const { filter, error } = makeFilter();
    const { host } = makeHost();

    filter.catch(prismaError('P2002', 'unique 위반'), host);

    const [payload] = error.mock.calls[0];
    expect(payload.prismaCode).toBe('P2002');
    expect(String(payload.remediation)).toContain('upsert');
  });

  it('DB 연결 실패에는 docker compose 안내를 남긴다', () => {
    const { filter, error } = makeFilter();
    const { host } = makeHost();

    filter.catch(prismaError('P1001', '연결 실패'), host);

    const [payload] = error.mock.calls[0];
    expect(String(payload.remediation)).toContain('docker compose up -d');
  });

  it('처방이 없는 코드에는 remediation을 붙이지 않는다', () => {
    const { filter, error } = makeFilter();
    const { host } = makeHost();

    filter.catch(prismaError('P9999'), host);

    const [payload] = error.mock.calls[0];
    expect(payload).not.toHaveProperty('remediation');
  });

  it('수정 지침은 응답 본문에 넣지 않는다 (내부 구조 노출 방지)', () => {
    const { filter } = makeFilter();
    const { host, json } = makeHost();

    filter.catch(prismaError('P2002', 'unique 위반'), host);

    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('upsert');
  });

  it('4xx는 warn으로 남긴다 (logs:errors가 404로 뒤덮이지 않게)', () => {
    const { filter, error, warn } = makeFilter();
    const { host } = makeHost();

    filter.catch(new HttpException('없음', HttpStatus.NOT_FOUND), host);

    expect(warn).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('5xx는 error로 남긴다', () => {
    const { filter, error, warn } = makeFilter();
    const { host } = makeHost();

    filter.catch(new Error('터짐'), host);

    expect(error).toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('요청 경로와 메서드를 로그에 남긴다', () => {
    const { filter, error } = makeFilter();
    const { host } = makeHost('/reviews', 'POST');

    filter.catch(new Error('터짐'), host);

    const [payload] = error.mock.calls[0];
    expect(payload).toMatchObject({ path: '/reviews', method: 'POST' });
  });
});
