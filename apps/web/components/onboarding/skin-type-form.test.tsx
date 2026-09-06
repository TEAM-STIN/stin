import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { SkinTypeForm } from "./skin-type-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("SkinTypeForm", () => {
  it("피부타입 5개를 렌더한다", () => {
    render(<SkinTypeForm />);
    for (const label of ["지성", "건성", "복합성", "수부지", "중성"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("선택 전에는 '다음'이 비활성이다", () => {
    render(<SkinTypeForm />);
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("항목을 고르면 aria-pressed 가 켜지고 '다음'이 활성화된다", () => {
    render(<SkinTypeForm />);
    fireEvent.click(screen.getByRole("button", { name: "지성" }));

    expect(screen.getByRole("button", { name: "지성" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("다른 항목을 고르면 이전 선택이 해제된다", () => {
    render(<SkinTypeForm />);
    fireEvent.click(screen.getByRole("button", { name: "지성" }));
    fireEvent.click(screen.getByRole("button", { name: "건성" }));

    expect(screen.getByRole("button", { name: "지성" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "건성" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("'다음'을 누르면 선택값을 쿼리에 실어 2단계로 이동한다", () => {
    render(<SkinTypeForm />);
    fireEvent.click(screen.getByRole("button", { name: "복합성" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(push).toHaveBeenCalledWith(
      "/onboarding/concerns?skinType=COMBINATION",
    );
  });

  it("defaultValue 가 있으면 미리 선택된 상태로 시작한다", () => {
    render(<SkinTypeForm defaultValue="DRY" />);

    expect(screen.getByRole("button", { name: "건성" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });
});
