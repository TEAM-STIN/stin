# STIN 디자인 시스템

프론트(`apps/web`)의 시각 언어와 컴포넌트 규칙. 값은 전부
`STIN 자료/디자인 초안 - 무겸/*.dc.html` 시안에서 추출했다.

## 기본 방침

- **다크모드 미지원.** `globals.css`에 `@custom-variant dark (&:is(.dark *))`가 있지만
  `.dark` 클래스를 어디에도 붙이지 않으므로 shadcn 컴포넌트의 `dark:` 유틸은 전부 죽는다.
- **모바일 전용, 390px 고정.** `app/layout.tsx`가 `max-w-frame`(=390px) 프레임을 중앙 정렬하고,
  데스크톱에선 프레임 뒤로 `--backdrop`(#ECECEC)이 보인다.
- **베이스 색 `#F4D2E3`**: 브랜드 표면(강조 카드·선택 배경·안내 배너)에만. 넓은 배경엔 안 쓴다.
- **포인트 색 `#FF4DC4`**: CTA·활성 상태·링크·뱃지 등 강조 요소에만.

## 색 토큰

`app/globals.css`의 `:root`에 정의, `@theme inline`에서 `--color-*`로 매핑된다.
Tailwind 유틸(`bg-primary`, `text-brand-foreground` 등)로 쓴다.

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `background` | `#FFFFFF` | 앱/프레임 배경 |
| `foreground` | `#262626` | 제목·강조 텍스트 |
| `body` | `#737373` | 본문 텍스트 |
| `muted-foreground` | `#8A8A8A` | 보조·메타 텍스트 |
| `primary` | `#FF4DC4` | CTA·활성·링크·뱃지 |
| `primary-hover` | `#E0359F` | primary hover |
| `primary-foreground` | `#FFFFFF` | 포인트 위 텍스트 |
| `brand` | `#F4D2E3` | 브랜드 표면 |
| `brand-foreground` | `#9C1F6B` | 브랜드 표면 위 텍스트·아이콘 |
| `brand-subtle` | `#FAEEF4` | 썸네일·이미지 placeholder |
| `border` | `#F0F0F0` | 카드 보더·디바이더 |
| `input` | `#EAEAEA` | 인풋 보더(1.5px) |
| `ring` | `#FF4DC4` | 포커스 링 |
| `backdrop` | `#ECECEC` | 데스크톱 프레임 뒤 배경 |
| `destructive` | `#E5484D` | 파괴적 액션 |

**아직 미정의** (필요한 화면 PR에서 추가): success/warning 등 의미색, 프로그레스 트랙,
바텀시트 오버레이/그림자.

## 타이포그래피

폰트: **Pretendard Variable** self-host (`app/fonts/PretendardVariable.woff2`,
`next/font/local`, SIL OFL-1.1). fallback은 `Apple SD Gothic Neo` / `Malgun Gothic` / system.

시안 9개 화면에서 교차 확인한 스케일:

| 역할 | 크기 / 행간 / 굵기 |
| --- | --- |
| 디스플레이 | 30 / 1.35 / 700 |
| 페이지 타이틀 | 21–22 / — / 700 |
| 섹션·다이얼로그 타이틀 | 19 / — / 700 |
| 카드 타이틀 | 15 / — / 700 |
| 본문 | 15 / 1.6 |
| 본문 small | 13 / 1.5 |
| 메타·캡션 | 12–13 |
| 워드마크 | 22 / — / 700, letter-spacing 0.09em |

한글 본문은 `break-keep`(word-break: keep-all)으로 어절 단위 줄바꿈.

## 모양

radius 스케일 (`--radius: 0.75rem` 기준):

| 유틸 | 값 | 용도 |
| --- | --- | --- |
| `rounded-md` | 10 | 인풋 |
| `rounded-lg` | 12 | 버튼 |
| `rounded-xl` | 14 | 결과·옵션 카드 |
| `rounded-2xl` | 16 | 브랜드 표면 카드 |
| `rounded-3xl` | 20 | 바텀시트 |
| `rounded-full` | pill | 칩·토글·강조 CTA |

그림자: `shadow-card` = `0 1px 3px rgb(0 0 0 / .04)`, `shadow-cta` = `0 10px 24px rgb(255 77 196 / .28)`.

## 컴포넌트 규칙

```
components/ui/*         shadcn 생성물. 원본에 가깝게 유지 — 색/크기는 토큰과 최소 수정으로만.
components/*            여러 화면이 공유하는 우리 조합 컴포넌트.
components/<feature>/*  특정 화면 전용 컴포넌트. 다른 화면에서 필요해지면 승격 검토.
```

- shadcn: `pnpm dlx shadcn@latest add <name>` — 추가는 **PR로**. `components.json` 커밋됨.
- 테마 변경은 `globals.css` 토큰에서만. 컴포넌트 파일에 하드코딩 색 금지.
- 아이콘: `lucide-react`, 기본 `strokeWidth={1.8}`.
- Button: `size="lg"`가 모바일 기본 CTA(높이 48). pill 형태 강조 CTA는 사용처에서
  `className="rounded-full px-12 text-base shadow-cta"` 부여.
