"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Concern, RoutineLevel, SkinType } from "@stin/types";

import { Button } from "@/components/ui/button";
import { SelectCard } from "@/components/select-card";
import { cn } from "@/lib/utils";
import { serializeConcerns } from "@/lib/onboarding/concerns";
import { skinTypeLabel } from "@/lib/onboarding/skin-types";
import {
  ROUTINE_LEVEL_OPTIONS,
  recommendedLevelFor,
} from "@/lib/onboarding/routine-levels";

interface RoutineLevelFormProps {
  skinType: SkinType;
  /** 앞 단계에서 넘어온 고민. 결과 화면으로 계속 실어 보낸다. */
  concerns: Concern[];
  /** 뒤로 돌아왔을 때 복원할 값 */
  defaultLevel?: RoutineLevel;
}

/**
 * 온보딩 3단계(마지막) 본문. 단계 수를 정하고 "루틴 추천받기"로
 * 추천 결과 화면(`/routine`)으로 넘어간다.
 * 선크림·클렌징은 단계 수에서 제외 — 선크림은 추천 로직이 오전 루틴/안내 문구로 처리한다.
 * 추천 단계 수가 기본 선택돼 있어 별도 선택 없이도 진행할 수 있다.
 */
export function RoutineLevelForm({
  skinType,
  concerns,
  defaultLevel,
}: RoutineLevelFormProps) {
  const router = useRouter();
  const recommended = recommendedLevelFor(skinType);
  const [level, setLevel] = useState<RoutineLevel>(defaultLevel ?? recommended);

  function handleSubmit() {
    let query = `?skinType=${skinType}`;
    const serialized = serializeConcerns(concerns);
    if (serialized) query += `&concerns=${serialized}`;
    query += `&level=${level}`;
    router.push(`/routine${query}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-7 flex flex-col gap-6 px-6">
        {ROUTINE_LEVEL_OPTIONS.map((option) => {
          const isSelected = level === option.value;
          return (
            <SelectCard
              key={option.value}
              selected={isSelected}
              onClick={() => setLevel(option.value)}
              badge={
                option.value === recommended
                  ? `${skinTypeLabel(skinType)} 피부에 추천`
                  : undefined
              }
            >
              <div
                className={cn(
                  "text-[15px] font-bold",
                  isSelected ? "text-brand-foreground" : "text-foreground",
                )}
              >
                {option.title}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[13px]",
                  isSelected
                    ? "text-brand-foreground/85"
                    : "text-muted-foreground",
                )}
              >
                {option.steps}
              </div>
            </SelectCard>
          );
        })}
      </div>

      <div className="mt-9 px-6 pb-10">
        <Button size="lg" className="w-full" onClick={handleSubmit}>
          루틴 추천받기
        </Button>
      </div>
    </div>
  );
}
