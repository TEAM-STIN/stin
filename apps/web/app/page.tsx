/**
 * 루트 라우트 플레이스홀더.
 * 디자인 시스템(토큰·폰트·프레임·Button)만 올린 상태이고, 실제 화면은 후속 PR에서 붙인다.
 */
export default function Page() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="text-[22px] font-bold tracking-[0.09em] text-primary">
        STIN
      </span>
      <p className="text-sm text-muted-foreground">화면 준비 중</p>
    </main>
  );
}
