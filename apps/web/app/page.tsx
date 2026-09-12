import type { ComponentType } from "react";
import Link from "next/link";
import { MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 랜딩 (#11). 서비스 소개 + 온보딩 진입점.
 * 카피·레이아웃 출처: `~/Desktop/STIN 자료/Main.dc.html`.
 */

interface Feature {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "피부타입 맞춤 추천",
    description: "지성·건성 등 피부타입에 맞는 제품만 골라서 보여줘요",
  },
  {
    icon: ShieldCheck,
    title: "성분 조합 검증",
    description: "레티놀·AHA/BHA 같은 성분 궁합까지 미리 확인해요",
  },
  {
    icon: MessagesSquare,
    title: "실사용자 리뷰",
    description: "같은 피부타입 사용자들의 솔직한 리뷰를 확인하세요",
  },
];

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl bg-brand p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/55 text-brand-foreground">
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-bold text-brand-foreground">
          {title}
        </span>
        <span className="text-[13px] leading-relaxed break-keep text-brand-foreground/85">
          {description}
        </span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="flex flex-1 flex-col pb-14">
      <div className="pt-14 text-center">
        <span className="text-[22px] font-bold tracking-[0.09em] text-primary">
          STIN
        </span>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 px-7 text-center">
        <h1 className="text-3xl leading-[1.35] font-bold break-keep text-foreground">
          피부타입에 맞는
          <br />
          루틴을 한 번에
        </h1>
        <p className="text-[15px] leading-relaxed break-keep text-body">
          성분 궁합까지 검증한 스킨케어 루틴을
          <br />
          단계별로 한 세트로 추천해드려요
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        <Button
          asChild
          size="lg"
          className="rounded-full px-12 text-base shadow-cta"
        >
          <Link href="/onboarding">시작하기</Link>
        </Button>
      </div>

      <div className="mt-[76px] flex flex-col gap-3 px-5">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </main>
  );
}
