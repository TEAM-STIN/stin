import { describe, expect, it } from "vitest";
import {
  isRoutineLevel,
  recommendedLevelFor,
} from "./routine-levels";

describe("isRoutineLevel", () => {
  it("정의된 레벨만 통과시킨다", () => {
    expect(isRoutineLevel("LEVEL_2")).toBe(true);
    expect(isRoutineLevel("LEVEL_3")).toBe(true);
    expect(isRoutineLevel("LEVEL_4")).toBe(true);
    expect(isRoutineLevel("LEVEL_9")).toBe(false);
    expect(isRoutineLevel(undefined)).toBe(false);
  });
});

describe("recommendedLevelFor", () => {
  it("피부타입별 추천 레벨을 돌려준다", () => {
    expect(recommendedLevelFor("OILY")).toBe("LEVEL_3");
    expect(recommendedLevelFor("DEHYDRATED_OILY")).toBe("LEVEL_4");
    expect(recommendedLevelFor("NORMAL")).toBe("LEVEL_2");
  });
});
