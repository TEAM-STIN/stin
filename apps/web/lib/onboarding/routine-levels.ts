import type { SkinType, StepCount } from "@stin/types";

/**
 * 온보딩 3단계 루틴 단계 수 선택지. 라벨·구성은 디자인 초안
 * (`~/Desktop/STIN 자료/Onboarding3.dc.html`)에서 가져왔다.
 * 초안은 클렌저를 단계 수에서 빼고 2/3/4단계로 표기한다.
 */
export interface RoutineLevelOption {
  value: StepCount;
  /** "3단계" */
  title: string;
  /** "토너 · 세럼 · 크림" */
  steps: string;
}

export const ROUTINE_LEVEL_OPTIONS: readonly RoutineLevelOption[] = [
  { value: 2, title: "2단계", steps: "토너 · 크림" },
  { value: 3, title: "3단계", steps: "토너 · 세럼 · 크림" },
  {
    value: 4,
    title: "4단계",
    steps: "토너 · 가벼운 세럼 · 고농축 세럼 · 크림",
  },
] as const;

/**
 * 쿼리 문자열의 단계 수를 파싱한다. "2" / "3" / "4"만 받고 나머지는 undefined.
 * `Number()`는 " 3", "3.0", "0x3"도 3으로 바꾸므로 문자열 그대로 비교한다.
 */
export function parseStepCount(
  value: string | undefined | null,
): StepCount | undefined {
  return ROUTINE_LEVEL_OPTIONS.find((o) => String(o.value) === value)?.value;
}

/**
 * 피부타입별 추천 단계 수. 루틴 템플릿 API가 붙기 전까지 쓰는 임시 매핑.
 * 모든 피부타입에서 3단계로 통일한다 (2026-09-17 결정). 시드의 `recommendedSkinTypes`와 같은 값이어야 한다.
 */
const RECOMMENDED_STEP_COUNT: Record<SkinType, StepCount> = {
  OILY: 3,
  DRY: 3,
  COMBINATION: 3,
  DEHYDRATED_OILY: 3,
  NORMAL: 3,
};

export function recommendedStepCountFor(skinType: SkinType): StepCount {
  return RECOMMENDED_STEP_COUNT[skinType];
}
