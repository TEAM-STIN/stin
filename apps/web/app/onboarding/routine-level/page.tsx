import { redirect } from "next/navigation";
import type { SkinType } from "@stin/types";

import { AppHeader } from "@/components/app-header";
import { StepProgress } from "@/components/step-progress";
import { RoutineLevelForm } from "@/components/onboarding/routine-level-form";
import { isSkinType } from "@/lib/onboarding/skin-types";
import { parseConcerns, serializeConcerns } from "@/lib/onboarding/concerns";
import { isRoutineLevel } from "@/lib/onboarding/routine-levels";

/**
 * 온보딩 3단계 — 단계 수 선택 (#12).
 * 카피·레이아웃 출처: `~/Desktop/STIN 자료/Onboarding3.dc.html`.
 * 초안의 "선크림 포함" 토글은 제거 — 선크림은 사용자 옵션이 아니라 추천 로직이 처리한다.
 */
export default async function RoutineLevelStepPage(
  props: PageProps<"/onboarding/routine-level">,
) {
  const sp = await props.searchParams;
  const rawSkinType = Array.isArray(sp.skinType) ? sp.skinType[0] : sp.skinType;

  if (!isSkinType(rawSkinType)) {
    redirect("/onboarding/skin-type");
  }

  const skinType: SkinType = rawSkinType;
  const concerns = parseConcerns(sp.concerns);

  const rawLevel = Array.isArray(sp.level) ? sp.level[0] : sp.level;
  const defaultLevel = isRoutineLevel(rawLevel) ? rawLevel : undefined;

  // 뒤로가기: 2단계로 돌아가며 그동안 고른 값 유지
  const concernsQuery = serializeConcerns(concerns);
  const backHref = `/onboarding/concerns?skinType=${skinType}${
    concernsQuery ? `&concerns=${concernsQuery}` : ""
  }`;

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader backHref={backHref} />
      <StepProgress total={3} current={3} className="px-6 pt-4" />

      <h1 className="px-6 pt-8 text-[22px] font-bold break-keep text-foreground">
        몇 단계로 관리하시겠어요?
      </h1>

      <RoutineLevelForm
        skinType={skinType}
        concerns={concerns}
        defaultLevel={defaultLevel}
      />
    </main>
  );
}
