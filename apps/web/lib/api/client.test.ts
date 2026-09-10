import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';
import { REQUEST_ID_HEADER } from './request-id';

function mockFetch(status: number, serverRequestId?: string) {
  // fetch와 같은 시그니처로 둬야 mock.calls에서 init을 타입 안전하게 꺼낼 수 있다.
  const spy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify({ ok: true }), {
      status,
      headers: serverRequestId
        ? { [REQUEST_ID_HEADER]: serverRequestId, 'content-type': 'application/json' }
        : { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

function sentHeaders(spy: ReturnType<typeof mockFetch>): Record<string, string> {
  const init = spy.mock.calls[0]?.[1];
  return (init?.headers ?? {}) as Record<string, string>;
}

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('요청마다 x-request-id를 실어 보낸다', async () => {
    const spy = mockFetch(200);
    await apiFetch('/routines');
    expect(sentHeaders(spy)[REQUEST_ID_HEADER]).toBeTruthy();
  });

  it('넘겨받은 requestId가 있으면 그걸 이어쓴다', async () => {
    const spy = mockFetch(200);
    await apiFetch('/routines', { requestId: 'flow-42' });
    expect(sentHeaders(spy)[REQUEST_ID_HEADER]).toBe('flow-42');
  });

  it('서버가 돌려준 ID를 우선한다', async () => {
    mockFetch(200, 'server-side-id');
    const res = await apiFetch('/routines', { requestId: 'client-id' });
    expect(res.requestId).toBe('server-side-id');
  });

  it('실패하면 에러 메시지에 requestId를 담는다', async () => {
    mockFetch(500, 'boom-id');
    await expect(apiFetch('/routines')).rejects.toThrow(/boom-id/);
  });

  it('실패는 ApiError로 던진다', async () => {
    mockFetch(404, 'nf-id');
    await expect(apiFetch('/routines')).rejects.toBeInstanceOf(ApiError);
  });

  it('기존 헤더를 지우지 않는다', async () => {
    const spy = mockFetch(200);
    await apiFetch('/routines', { headers: { 'content-type': 'application/json' } });
    expect(sentHeaders(spy)['content-type']).toBe('application/json');
  });
});
