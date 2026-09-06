import { cn } from "@/lib/utils";

interface StepProgressProps {
  /** 전체 단계 수 */
  total: number;
  /** 현재 단계 (1-based). 이 값까지 채워진다. */
  current: number;
  className?: string;
}

/**
 * 온보딩 상단 진행바. 초안: 4px 높이, gap 8, 채워진 칸은 primary,
 * 나머지는 #ECECEC.
 */
export function StepProgress({ total, current, className }: StepProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`${total}단계 중 ${current}단계`}
      className={cn("flex gap-2", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full",
            // 빈 트랙은 초안 #ECECEC — backdrop 토큰과 같은 값을 재사용
            i < current ? "bg-primary" : "bg-backdrop",
          )}
        />
      ))}
    </div>
  );
}
