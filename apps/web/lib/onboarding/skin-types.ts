import type { SkinType } from "@stin/types";

/**
 * 온보딩 1단계 피부타입 선택지. 라벨·순서는 디자인 초안
 * (`~/Desktop/STIN 자료/Onboarding1.dc.html`)에서 가져왔다.
 * enum 값은 `@stin/types`가 소스 오브 트루스.
 */
export interface SkinTypeOption {
  value: SkinType;
  label: string;
}

/** 초안 순서: 지성 · 건성 · 복합성 · 수부지 · 중성 (5개) */
export const SKIN_TYPE_OPTIONS: readonly SkinTypeOption[] = [
  { value: "OILY", label: "지성" },
  { value: "DRY", label: "건성" },
  { value: "COMBINATION", label: "복합성" },
  { value: "DEHYDRATED_OILY", label: "수부지" },
  { value: "NORMAL", label: "중성" },
] as const;

const SKIN_TYPE_VALUES = new Set<string>(SKIN_TYPE_OPTIONS.map((o) => o.value));

export function isSkinType(value: string | undefined | null): value is SkinType {
  return typeof value === "string" && SKIN_TYPE_VALUES.has(value);
}

export function skinTypeLabel(value: SkinType): string {
  return SKIN_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
