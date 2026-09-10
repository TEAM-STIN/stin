import { REQUEST_ID_HEADER, newRequestId } from './request-id';

/**
 * API 호출은 전부 이 함수를 거친다.
 *
 * 직접 fetch를 쓰면 요청 ID가 빠져서 서버 로그와 이어붙일 수 없다.
 * 새 엔드포인트를 추가할 때도 여기를 통해서 부른다.
 */
export interface ApiRequestInit extends RequestInit {
  /** 이미 진행 중인 흐름의 ID를 이어받을 때 넘긴다. 없으면 새로 만든다. */
  requestId?: string;
}

export interface ApiResponse<T> {
  data: T;
  /** 서버가 이 요청에 붙인 ID. 실패를 신고할 때 이 값을 함께 남긴다. */
  requestId: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  { requestId, headers, ...init }: ApiRequestInit = {},
): Promise<ApiResponse<T>> {
  const id = requestId ?? newRequestId();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, [REQUEST_ID_HEADER]: id },
  });

  // 서버가 헤더를 되돌려주므로 그 값을 우선한다 (프록시가 바꿨을 수 있다).
  const serverId = response.headers.get(REQUEST_ID_HEADER) ?? id;

  if (!response.ok) {
    throw new ApiError(response.status, serverId, path);
  }

  return { data: (await response.json()) as T, requestId: serverId };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly requestId: string,
    readonly path: string,
  ) {
    // 요청 ID를 메시지에 넣는다. 이걸로 `pnpm logs:req <id>`를 바로 칠 수 있다.
    super(`API ${status} ${path} (requestId: ${requestId})`);
    this.name = 'ApiError';
  }
}
