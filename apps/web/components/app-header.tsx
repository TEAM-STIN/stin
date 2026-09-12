"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface AppHeaderProps {
  /** 뒤로가기 버튼 노출 여부. 기본 true */
  showBack?: boolean;
  /** 지정하면 이 경로로 이동. 없으면 router.back() */
  backHref?: string;
  /** 가운데 정렬 타이틀 (선택) */
  title?: string;
}

const BACK_BUTTON_CLASS =
  "-ml-2 flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * 화면 상단 바. 초안 기준 뒤로가기 화살표는 좌측 상단(22×22, stroke 2).
 * 온보딩 1단계처럼 뒤로가기가 없는 화면은 `showBack={false}`.
 */
export function AppHeader({ showBack = true, backHref, title }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="relative flex items-center px-5 pt-4">
      {showBack &&
        (backHref ? (
          <Link
            href={backHref}
            aria-label="뒤로 가기"
            className={BACK_BUTTON_CLASS}
          >
            <ChevronLeft className="size-[22px]" strokeWidth={2} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => router.back()}
            className={BACK_BUTTON_CLASS}
          >
            <ChevronLeft className="size-[22px]" strokeWidth={2} />
          </button>
        ))}
      {title && (
        <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-bold text-foreground">
          {title}
        </span>
      )}
    </header>
  );
}
