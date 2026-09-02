import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Pretendard Variable (v1.3.9, SIL Open Font License 1.1)
 * https://github.com/orioncactus/pretendard
 * 시안은 시스템 폰트 스택이었으나, 배포 환경(EC2, CDN 미사용) 전반에서
 * 한글 렌더링을 일관되게 맞추려고 self-host 하는 Pretendard로 확정.
 */
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: {
    default: "STIN",
    template: "%s · STIN",
  },
  description:
    "피부타입에 맞는 스킨케어 루틴을 단계별로 추천하고 성분 궁합까지 검증해요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="min-h-full">
        {/* 모바일 전용: 390px 프레임을 중앙 정렬. 데스크톱에선 뒤로 backdrop 노출 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-frame flex-col bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
