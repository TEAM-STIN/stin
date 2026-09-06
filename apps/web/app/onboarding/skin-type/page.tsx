import type { SkinType } from "@stin/types";

import { StepProgress } from "@/components/step-progress";
import { SkinTypeForm } from "@/components/onboarding/skin-type-form";
import { isSkinType } from "@/lib/onboarding/skin-types";

/**
 * 온보딩 1단계 — 피부타입 선택 (#12).
 * 카피·레이아웃 출처: `~/Desktop/STIN 자료/Onboarding1.dc.html`.
 * 1단계라 뒤로가기 버튼은 없다.
 */
export default async function SkinTypeStepPage(
  props: PageProps<"/onboarding/skin-type">,
) {
  const { skinType } = await props.searchParams;
  const raw = Array.isArray(skinType) ? skinType[0] : skinType;
  const defaultValue: SkinType | undefined = isSkinType(raw) ? raw : undefined;

  return (
    <main className="flex flex-1 flex-col">
      <StepProgress total={3} current={1} className="px-6 pt-5" />

      <h1 className="px-6 pt-8 text-[22px] font-bold break-keep text-foreground">
        피부타입을 선택해주세요
      </h1>

      <SkinTypeForm defaultValue={defaultValue} />
    </main>
  );
}
