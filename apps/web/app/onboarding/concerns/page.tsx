import { redirect } from "next/navigation";
import type { SkinType } from "@stin/types";

import { AppHeader } from "@/components/app-header";
import { StepProgress } from "@/components/step-progress";
import { ConcernsForm } from "@/components/onboarding/concerns-form";
import { isSkinType } from "@/lib/onboarding/skin-types";
import { parseConcerns } from "@/lib/onboarding/concerns";

/**
 * 온보딩 2단계 — 피부 고민 선택 (#12).
 * 카피·레이아웃 출처: `~/Desktop/STIN 자료/Onboarding2.dc.html`.
 */
export default async function ConcernsStepPage(
  props: PageProps<"/onboarding/concerns">,
) {
  const sp = await props.searchParams;
  const rawSkinType = Array.isArray(sp.skinType) ? sp.skinType[0] : sp.skinType;

  // 1단계를 건너뛰고 들어온 경우 되돌린다.
  if (!isSkinType(rawSkinType)) {
    redirect("/onboarding/skin-type");
  }

  const skinType: SkinType = rawSkinType;
  const defaultValues = parseConcerns(sp.concerns);

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader backHref={`/onboarding/skin-type?skinType=${skinType}`} />
      <StepProgress total={3} current={2} className="px-6 pt-4" />

      <h1 className="px-6 pt-8 text-[22px] font-bold break-keep text-foreground">
        피부 고민을 선택해주세요
      </h1>
      <p className="px-6 pt-2 text-sm text-muted-foreground">중복 선택 가능</p>

      <ConcernsForm skinType={skinType} defaultValues={defaultValues} />
    </main>
  );
}
