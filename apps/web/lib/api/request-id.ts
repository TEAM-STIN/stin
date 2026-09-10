/** API 요청을 식별하는 헤더. `apps/api`의 REQUEST_ID_HEADER와 같은 값이어야 한다. */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * 브라우저에서 시작된 요청 하나에 ID를 붙인다.
 *
 * 왜: 이 헤더가 없으면 API가 요청마다 새 ID를 만들고, 프론트에서 본 증상과
 * 서버 로그를 이어붙일 방법이 없어진다. 헤더를 실어 보내면 브라우저 → API → DB가
 * 같은 ID로 묶여서 `pnpm logs:req <id>` 한 번에 전 구간이 나온다.
 */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // randomUUID가 없는 환경(구형 브라우저·비보안 컨텍스트) 대비.
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
