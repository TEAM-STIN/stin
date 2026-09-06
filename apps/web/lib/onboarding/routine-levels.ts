import type { RoutineLevel, SkinType } from "@stin/types";

/**
 * 온보딩 3단계 루틴 단계 수 선택지. 라벨·구성은 디자인 초안
 * (`~/Desktop/STIN 자료/Onboarding3.dc.html`)에서 가져왔다.
 * 초안은 클렌저를 단계 수에서 빼고 2/3/4단계로 표기한다.
 */
export interface RoutineLevelOption {
  value: RoutineLevel;
  /** "3단계" */
  title: string;
  /** "토너 · 세럼 · 크림" */
  steps: string;
}

export const ROUTINE_LEVEL_OPTIONS: readonly RoutineLevelOption[] = [
  { value: "LEVEL_2", title: "2단계", steps: "토너 · 크림" },
  { value: "LEVEL_3", title: "3단계", steps: "토너 · 세럼 · 크림" },
  {
    value: "LEVEL_4",
    title: "4단계",
    steps: "토너 · 가벼운 세럼 · 고농축 세럼 · 크림",
  },
] as const;

const ROUTINE_LEVEL_VALUES = new Set<string>(
  ROUTINE_LEVEL_OPTIONS.map((o) => o.value),
);

export function isRoutineLevel(
  value: string | undefined | null,
): value is RoutineLevel {
  return typeof value === "string" && ROUTINE_LEVEL_VALUES.has(value);
}

/**
 * 피부타입별 추천 단계 수. 백엔드 추천 로직(#8)이 붙기 전까지 쓰는 임시 매핑.
 * 초안은 지성 → 3단계를 추천으로 표시한다.
 */
const RECOMMENDED_LEVEL: Record<SkinType, RoutineLevel> = {
  OILY: "LEVEL_3",
  DRY: "LEVEL_3",
  COMBINATION: "LEVEL_3",
  DEHYDRATED_OILY: "LEVEL_4",
  NORMAL: "LEVEL_2",
};

export function recommendedLevelFor(skinType: SkinType): RoutineLevel {
  return RECOMMENDED_LEVEL[skinType];
}
