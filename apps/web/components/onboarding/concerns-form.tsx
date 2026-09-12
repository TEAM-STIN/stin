"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Concern, SkinType } from "@stin/types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CONCERN_OPTIONS,
  serializeConcerns,
} from "@/lib/onboarding/concerns";

interface ConcernsFormProps {
  /** 1단계에서 넘어온 피부타입. 3단계로 계속 실어 보낸다. */
  skinType: SkinType;
  /** 뒤로 돌아왔을 때 복원할 이전 선택값 */
  defaultValues?: Concern[];
}

/**
 * 온보딩 2단계 본문. 피부 고민을 0개 이상 고르고 "다음"으로 3단계로 넘어간다.
 * 중복 선택 가능하고, 하나도 안 골라도 진행할 수 있다.
 */
export function ConcernsForm({ skinType, defaultValues }: ConcernsFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Concern[]>(defaultValues ?? []);

  function toggle(value: Concern) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  function handleNext() {
    // 쉼표는 쿼리에서 허용되는 문자라 인코딩하지 않고 그대로 둔다 (URL 가독성)
    const concerns = serializeConcerns(selected);
    const query = concerns
      ? `?skinType=${skinType}&concerns=${concerns}`
      : `?skinType=${skinType}`;
    router.push(`/onboarding/routine-level${query}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex flex-wrap gap-2.5 px-6">
        {CONCERN_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
              className={cn(
                "rounded-full border-[1.5px] px-5 py-2.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-input bg-background font-medium text-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-12 px-6 pb-10">
        <Button size="lg" className="w-full" onClick={handleNext}>
          다음
        </Button>
      </div>
    </div>
  );
}
