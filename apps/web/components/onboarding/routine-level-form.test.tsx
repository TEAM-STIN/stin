import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RoutineLevelForm } from "./routine-level-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("RoutineLevelForm", () => {
  it("단계 카드 3개를 렌더한다", () => {
    render(<RoutineLevelForm skinType="OILY" concerns={[]} />);
    expect(screen.getByRole("button", { name: /2단계/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3단계/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /4단계/ })).toBeInTheDocument();
  });

  it("피부타입 추천 레벨이 기본 선택되고 배지가 뜬다", () => {
    render(<RoutineLevelForm skinType="OILY" concerns={[]} />);
    expect(screen.getByRole("button", { name: /3단계/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("지성 피부에 추천")).toBeInTheDocument();
  });

  it("다른 카드를 고르면 선택이 옮겨간다", () => {
    render(<RoutineLevelForm skinType="OILY" concerns={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /2단계/ }));

    expect(screen.getByRole("button", { name: /2단계/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /3단계/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("선크림 토글은 없다 (선크림은 추천 로직이 처리)", () => {
    render(<RoutineLevelForm skinType="OILY" concerns={[]} />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("'루틴 추천받기' → skinType·level 을 실어 결과 화면으로", () => {
    render(<RoutineLevelForm skinType="OILY" concerns={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "루틴 추천받기" }));

    expect(push).toHaveBeenCalledWith("/routine?skinType=OILY&level=LEVEL_3");
  });

  it("고민·레벨 변경이 쿼리에 반영된다", () => {
    render(<RoutineLevelForm skinType="DRY" concerns={["PORES", "ACNE"]} />);
    fireEvent.click(screen.getByRole("button", { name: /2단계/ }));
    fireEvent.click(screen.getByRole("button", { name: "루틴 추천받기" }));

    expect(push).toHaveBeenCalledWith(
      "/routine?skinType=DRY&concerns=ACNE,PORES&level=LEVEL_2",
    );
  });

  it("defaultLevel 로 복원된다", () => {
    render(
      <RoutineLevelForm
        skinType="OILY"
        concerns={[]}
        defaultLevel="LEVEL_4"
      />,
    );

    expect(screen.getByRole("button", { name: /4단계/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
