"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkinType } from "@stin/types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SKIN_TYPE_OPTIONS } from "@/lib/onboarding/skin-types";

interface SkinTypeFormProps {
  /** 뒤로 돌아왔을 때 복원할 이전 선택값 */
  defaultValue?: SkinType;
}

/**
 * 온보딩 1단계 본문. 피부타입 하나를 고르고 "다음"으로 2단계로 넘어간다.
 * 선택 전에는 "다음"이 비활성. 선택값은 쿼리에 실어 전달한다.
 */
export function SkinTypeForm({ defaultValue }: SkinTypeFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SkinType | undefined>(defaultValue);

  function handleNext() {
    if (!selected) return;
    router.push(`/onboarding/concerns?skinType=${selected}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-7 grid grid-cols-2 gap-3 px-6">
        {SKIN_TYPE_OPTIONS.map((option, index) => {
          const isSelected = selected === option.value;
          const isLastOdd =
            index === SKIN_TYPE_OPTIONS.length - 1 &&
            SKIN_TYPE_OPTIONS.length % 2 === 1;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(option.value)}
              className={cn(
                "rounded-lg border-[1.5px] px-3 py-[22px] text-center text-[15px] transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isLastOdd && "col-span-2",
                isSelected
                  ? "border-primary bg-brand font-bold text-brand-foreground"
                  : "border-input bg-background font-semibold text-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 px-6 pb-10">
        <Button
          size="lg"
          className="w-full"
          disabled={!selected}
          onClick={handleNext}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
