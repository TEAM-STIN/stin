import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConcernsForm } from "./concerns-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("ConcernsForm", () => {
  it("피부 고민 7개를 렌더한다", () => {
    render(<ConcernsForm skinType="OILY" />);
    for (const label of [
      "트러블",
      "각질",
      "모공",
      "홍조",
      "민감",
      "주름",
      "색소침착",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("하나도 안 골라도 '다음'은 활성이다", () => {
    render(<ConcernsForm skinType="OILY" />);
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("칩을 토글하면 aria-pressed 가 바뀐다", () => {
    render(<ConcernsForm skinType="OILY" />);
    const chip = screen.getByRole("button", { name: "트러블" });

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("여러 개를 동시에 선택할 수 있다", () => {
    render(<ConcernsForm skinType="OILY" />);
    fireEvent.click(screen.getByRole("button", { name: "트러블" }));
    fireEvent.click(screen.getByRole("button", { name: "모공" }));

    expect(screen.getByRole("button", { name: "트러블" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "모공" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("선택 없이 '다음' → skinType 만 실어 3단계로 이동", () => {
    render(<ConcernsForm skinType="OILY" />);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(push).toHaveBeenCalledWith("/onboarding/routine-level?skinType=OILY");
  });

  it("'다음' → 선택값을 CONCERN_OPTIONS 순서로 정렬해 실어 보낸다", () => {
    render(<ConcernsForm skinType="DRY" />);
    // 모공 → 트러블 순으로 클릭해도 결과는 ACNE,PORES
    fireEvent.click(screen.getByRole("button", { name: "모공" }));
    fireEvent.click(screen.getByRole("button", { name: "트러블" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(push).toHaveBeenCalledWith(
      "/onboarding/routine-level?skinType=DRY&concerns=ACNE,PORES",
    );
  });

  it("defaultValues 가 있으면 미리 선택된 상태로 시작한다", () => {
    render(<ConcernsForm skinType="OILY" defaultValues={["PORES", "AGING"]} />);

    expect(screen.getByRole("button", { name: "모공" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "주름" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
