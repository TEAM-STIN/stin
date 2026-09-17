import type { ConcernTag } from "@stin/types";

/**
 * 온보딩 2단계 피부 고민 선택지. 라벨·순서는 디자인 초안
 * (`~/Desktop/STIN 자료/Onboarding2.dc.html`)에서 가져왔다.
 * enum 값은 `@stin/types`가 소스 오브 트루스.
 */
export interface ConcernOption {
  value: ConcernTag;
  label: string;
}

/** 초안 순서: 트러블 · 각질 · 모공 · 홍조 · 민감 · 주름 · 색소침착 (중복 선택) */
export const CONCERN_OPTIONS: readonly ConcernOption[] = [
  { value: "TROUBLE", label: "트러블" },
  { value: "KERATIN", label: "각질" },
  { value: "PORE", label: "모공" },
  { value: "REDNESS", label: "홍조" },
  { value: "SENSITIVE", label: "민감" },
  { value: "WRINKLE", label: "주름" },
  { value: "PIGMENTATION", label: "색소침착" },
] as const;

const CONCERN_VALUES = new Set<string>(CONCERN_OPTIONS.map((o) => o.value));

export function isConcern(value: string): value is ConcernTag {
  return CONCERN_VALUES.has(value);
}

/**
 * 쿼리에서 concerns 를 읽는다. "TROUBLE,PORE" 와 반복 키(["TROUBLE","PORE"])를
 * 모두 허용하고, 잘못된 값·중복은 버린다. 순서는 CONCERN_OPTIONS 기준으로 정규화.
 */
export function parseConcerns(
  raw: string | string[] | undefined,
): ConcernTag[] {
  const tokens = Array.isArray(raw)
    ? raw.flatMap((chunk) => chunk.split(","))
    : (raw ?? "").split(",");

  const picked = new Set<string>();
  for (const token of tokens) {
    const value = token.trim();
    if (value && isConcern(value)) picked.add(value);
  }

  return CONCERN_OPTIONS.filter((o) => picked.has(o.value)).map((o) => o.value);
}

/** 선택된 concerns 를 CONCERN_OPTIONS 순서로 정렬한 쉼표 문자열 */
export function serializeConcerns(concerns: ConcernTag[]): string {
  const picked = new Set<string>(concerns);
  return CONCERN_OPTIONS.filter((o) => picked.has(o.value))
    .map((o) => o.value)
    .join(",");
}
