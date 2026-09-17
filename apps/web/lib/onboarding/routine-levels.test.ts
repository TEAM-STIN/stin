import { describe, expect, it } from "vitest";
import {
  parseStepCount,
  recommendedStepCountFor,
} from "./routine-levels";

describe("parseStepCount", () => {
  it("정의된 단계 수 문자열을 숫자로 바꾼다", () => {
    expect(parseStepCount("2")).toBe(2);
    expect(parseStepCount("3")).toBe(3);
    expect(parseStepCount("4")).toBe(4);
  });

  it("범위 밖이거나 비어 있으면 undefined", () => {
    expect(parseStepCount("1")).toBeUndefined();
    expect(parseStepCount("5")).toBeUndefined();
    expect(parseStepCount("")).toBeUndefined();
    expect(parseStepCount(undefined)).toBeUndefined();
    expect(parseStepCount(null)).toBeUndefined();
  });

  it("숫자로 해석될 뿐인 문자열과 이전 형식은 거부한다", () => {
    expect(parseStepCount(" 3")).toBeUndefined();
    expect(parseStepCount("3.0")).toBeUndefined();
    expect(parseStepCount("0x3")).toBeUndefined();
    expect(parseStepCount("LEVEL_3")).toBeUndefined();
  });
});

describe("recommendedStepCountFor", () => {
  it("모든 피부타입에서 3단계를 추천한다", () => {
    for (const skinType of [
      "OILY",
      "DRY",
      "COMBINATION",
      "DEHYDRATED_OILY",
      "NORMAL",
    ] as const) {
      expect(recommendedStepCountFor(skinType)).toBe(3);
    }
  });
});
