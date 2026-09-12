import { describe, expect, it } from "vitest";
import { parseConcerns, serializeConcerns } from "./concerns";

describe("parseConcerns", () => {
  it("쉼표 문자열을 파싱한다", () => {
    expect(parseConcerns("ACNE,PORES")).toEqual(["ACNE", "PORES"]);
  });

  it("반복 키(배열)를 파싱한다", () => {
    expect(parseConcerns(["ACNE", "PORES"])).toEqual(["ACNE", "PORES"]);
  });

  it("잘못된 값과 중복을 버린다", () => {
    expect(parseConcerns("ACNE,BOGUS,ACNE,PORES")).toEqual(["ACNE", "PORES"]);
  });

  it("빈 입력이면 빈 배열", () => {
    expect(parseConcerns(undefined)).toEqual([]);
    expect(parseConcerns("")).toEqual([]);
  });

  it("순서를 CONCERN_OPTIONS 기준으로 정규화한다", () => {
    // 입력은 역순이지만 결과는 옵션 정의 순서
    expect(parseConcerns("PIGMENTATION,ACNE")).toEqual(["ACNE", "PIGMENTATION"]);
  });
});

describe("serializeConcerns", () => {
  it("선택 순서와 무관하게 CONCERN_OPTIONS 순서로 직렬화한다", () => {
    expect(serializeConcerns(["PORES", "ACNE"])).toBe("ACNE,PORES");
  });

  it("빈 배열이면 빈 문자열", () => {
    expect(serializeConcerns([])).toBe("");
  });
});
