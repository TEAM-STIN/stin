import { redirect } from "next/navigation";

/** `/onboarding` 진입 시 첫 단계로 보낸다. */
export default function OnboardingPage() {
  redirect("/onboarding/skin-type");
}
