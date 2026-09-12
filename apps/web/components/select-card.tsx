import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SelectCardProps {
  selected?: boolean;
  /** 카드 좌상단에 겹쳐 표시되는 배지 (예: "지성 피부에 추천") */
  badge?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * 큰 선택 카드. 온보딩 단계 수 선택에 사용.
 * 선택 상태 = 브랜드 표면(#F4D2E3) + primary 보더. 상태는 부모가 관리한다.
 */
export function SelectCard({
  selected = false,
  badge,
  onClick,
  children,
  className,
}: SelectCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-[1.5px] p-5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-primary bg-brand"
          : "border-input bg-background hover:bg-muted",
        className,
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-[5px] text-xs font-bold text-primary-foreground">
          {badge}
        </span>
      )}
      {children}
    </button>
  );
}
