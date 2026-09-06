// ============================================================
//  @stin/types
//  프론트(apps/web)와 백엔드(apps/api)가 공유하는 타입 정의.
//  API의 요청/응답 "계약"만 담는다 — Prisma 모델 자체가 아니라
//  실제로 HTTP를 통해 오가는 형태를 기준으로 정의한다.
//  필드명을 바꿀 때는 이 파일을 먼저 수정하면, 반영이 안 된
//  쪽에서 컴파일 에러로 즉시 드러난다.
// ============================================================

// ---------- 공통 enum ----------

export type SkinType =
  | "OILY"
  | "DRY"
  | "COMBINATION"
  | "DEHYDRATED_OILY"
  | "NORMAL";

export type Concern =
  | "ACNE"
  | "KERATIN"
  | "PORES"
  | "REDNESS"
  | "SENSITIVITY"
  | "AGING"
  | "PIGMENTATION";

export type StepType =
  | "CLEANSER"
  | "TONER"
  | "SERUM_LIGHT"
  | "SERUM_RICH"
  | "CREAM"
  | "SUNSCREEN"
  | "EYE_CREAM";

export type TimeOfDay = "AM" | "PM";

export type RoutineLevel = "LEVEL_2" | "LEVEL_3" | "LEVEL_4";

// ---------- 온보딩 ----------

export interface OnboardingInput {
  skinType: SkinType;
  concerns: Concern[];
  routineLevel: RoutineLevel;
}
// 선크림·클렌징·아이크림은 사용자가 온보딩에서 고르는 값이 아니다.
// 선크림은 추천 로직이 오전 루틴/안내 문구로 처리한다.

/** 온보딩 3단계에서 "이 피부타입엔 이 레벨을 추천" 배지를 그리기 위한 응답 */
export interface RecommendedLevelResponse {
  skinType: SkinType;
  recommendedLevel: RoutineLevel;
}

// ---------- 제품 ----------

export interface ProductSummary {
  id: number;
  brandName: string;
  name: string;
  priceKrw: number | null;
  imageUrl: string | null;
  stepType: StepType;
}

export interface ProductDetail extends ProductSummary {
  volumeMl: number | null;
  texture: string | null;
  purchaseUrl: string | null;
  ingredients: string[]; // 표기 순서대로
  goodCount: number;
  badCount: number;
}

// ---------- 루틴 추천 ----------

/** 단계 하나에 대한 추천 결과. 근거 문장이 반드시 함께 온다. */
export interface RecommendedStep {
  order: number;
  stepType: StepType;
  product: ProductSummary;
  reason: string; // "지성 피부에는 유분감이 적은..." 같은 근거 문장
}

/** 제약 충돌로 인해 타협이 발생했을 때 사용자에게 보여줄 안내 */
export interface TradeOffNotice {
  message: string; // "레티놀과 함께 쓰지 않도록 아침/저녁으로 나눴습니다"
  affectedStepOrders: number[]; // 안내 배너를 어느 단계 근처에 붙일지
}

export interface RoutineRecommendation {
  timeOfDay: TimeOfDay;
  steps: RecommendedStep[];
  tradeOffs: TradeOffNotice[];
}

/** GET /routines/recommend 의 응답 — AM/PM 두 벌을 한 번에 반환 */
export interface RoutineRecommendationResponse {
  am: RoutineRecommendation;
  pm: RoutineRecommendation;
}

/** 특정 단계의 제품을 교체할 때 후보 목록을 요청하는 응답 */
export interface ProductAlternativesResponse {
  stepType: StepType;
  currentProductId: number;
  alternatives: ProductSummary[];
}

// ---------- 저장된 루틴 (로그인 사용자) ----------

export interface SavedRoutineSummary {
  id: number;
  name: string;
  timeOfDay: TimeOfDay;
  routineLevel: RoutineLevel;
  createdAt: string; // ISO date string
  previewImageUrls: string[]; // 미리보기용 제품 이미지 최대 3개
}

export interface SaveRoutineRequest {
  name: string;
  timeOfDay: TimeOfDay;
  routineLevel: RoutineLevel;
  skinTypeAtCreation: SkinType;
  concernsAtCreation: Concern[];
  steps: { order: number; stepType: StepType; productId: number }[];
}

// ---------- 리뷰 ----------

export type Verdict = "GOOD" | "BAD";

export type UsagePeriod = "UNDER_1W" | "W1_TO_M1" | "M1_TO_M3" | "OVER_M3";

export type NegativeReason =
  | "IRRITATION"
  | "OILINESS"
  | "SCENT"
  | "PRICE"
  | "TEXTURE"
  | "NO_EFFECT";

export interface ReviewSummary {
  id: number;
  verdict: Verdict;
  usagePeriod: UsagePeriod;
  repurchaseIntent: boolean | null;
  negativeReasons: NegativeReason[];
  body: string | null;
  skinTypeAtWriting: SkinType;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: number;
  verdict: Verdict;
  usagePeriod: UsagePeriod;
  repurchaseIntent?: boolean;
  negativeReasons?: NegativeReason[];
  body?: string;
}

// ---------- 인증 ----------

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  skinType: SkinType | null;
  concerns: Concern[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
