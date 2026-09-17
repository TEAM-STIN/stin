// ============================================================
//  @stin/types
//  프론트(apps/web)와 백엔드(apps/api)가 공유하는 타입 정의.
//  API의 요청/응답 "계약"만 담는다 — Prisma 모델 자체가 아니라
//  실제로 HTTP를 통해 오가는 형태를 기준으로 정의한다.
//  단, enum 값과 필드 이름은 apps/api/prisma/schema.prisma를 따른다.
//  필드명을 바꿀 때는 이 파일을 먼저 수정하면, 반영이 안 된
//  쪽에서 컴파일 에러로 즉시 드러난다.
// ============================================================

// ---------- 공통 enum ----------

export type SkinType =
  | "OILY" // 지성 피부
  | "DRY" // 건성 피부
  | "COMBINATION" // 복합성 피부
  | "DEHYDRATED_OILY" // 수부지(수분 부족 지성) 피부
  | "NORMAL"; // 중성 피부

export type ConcernTag =
  | "TROUBLE" // 트러블
  | "KERATIN" // 각질
  | "PORE" // 모공
  | "REDNESS" // 홍조
  | "SENSITIVE" // 민감
  | "WRINKLE" // 주름
  | "PIGMENTATION"; // 색소 침착

/**
 * 루틴 단계·제품 카테고리.
 * 스키마의 SUNSCREEN은 향후 확장용으로 현재 미사용이라(요구사항 §4.3·§9) 계약에 넣지 않는다.
 * 4단계의 '가벼운 세럼'·'고농축 세럼'은 카테고리가 아니라 단계의 label로 구분한다.
 */
export type StepCategory =
  | "TONER" // 토너
  | "SERUM" // 세럼
  | "CREAM"; // 크림

export type TimeOfDay = "AM" | "PM"; // 오전, 오후

/** 루틴 단계 수 (요구사항 §4.3) */
export type StepCount = 2 | 3 | 4; // 2단계, 3단계, 4단계

export type AuthProvider = "KAKAO"; // 카카오

// ---------- 온보딩 ----------

export interface OnboardingInput {
  skinType: SkinType;
  concernTags: ConcernTag[];
  stepCount: StepCount;
}
// 선크림·클렌징은 사용자가 온보딩에서 고르는 값이 아니다.
// 선크림은 루틴 단계가 아니라 모든 고민 공통 안내 문구로 노출한다 (FR-RSN-05).

/** 루틴 템플릿 단계 하나. label은 같은 카테고리가 두 번 나올 때만 있다 */
export interface RoutineTemplateStep {
  order: number;
  category: StepCategory;
  label: string | null; // "가벼운 세럼" / "고농축 세럼"
}

/** 온보딩 3단계 선택지와 "N단계 · O피부에 추천" 배지를 그리기 위한 템플릿 (FR-ONB-03) */
export interface RoutineTemplateSummary {
  stepCount: StepCount;
  recommendedSkinTypes: SkinType[];
  steps: RoutineTemplateStep[];
}

// ---------- 제품 ----------

export interface ProductSummary {
  id: string;
  brandName: string;
  name: string;
  price: number; // 원 단위
  imageUrl: string | null;
  category: StepCategory;
}

/** 제품 상세 (FR-PRD-01·02·04) */
export interface ProductDetail extends ProductSummary {
  volumeMl: number | null;
  isNoncomedogenic: boolean;
  suitableSkinTypes: SkinType[];
  ingredients: string[]; // 전성분 표기 순서대로
  reviewCount: number; // 평가 요약: 총 리뷰 수 (FR-REV-11)
  positiveReviewCount: number; // 평가 요약: 좋아요 수. 비율은 화면에서 계산
}

// ---------- 루틴 추천 ----------

/** 단계 하나에 대한 추천 결과. 근거 문장이 반드시 함께 온다. */
export interface RecommendedStep {
  order: number;
  category: StepCategory;
  label: string | null; // 4단계 세럼 구분. 그 외 단계는 null
  product: ProductSummary;
  reasonText: string; // "지성 피부에는 유분감이 적은..." 같은 근거 문장
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
  category: StepCategory;
  currentProductId: string;
  alternatives: ProductSummary[];
}

// ---------- 저장된 루틴 (로그인 사용자) ----------

export interface SavedRoutineSummary {
  id: string;
  name: string;
  stepCount: StepCount;
  skinTypeSnapshot: SkinType; // 저장 시점 피부타입 (FR-SAV-02)
  savedAt: string; // ISO date string
  previewImageUrls: string[]; // 미리보기용 제품 이미지 최대 3개
}

/** 루틴 하나에 AM/PM 단계를 함께 저장한다. 근거 문장은 서버가 저장 시점에 스냅샷한다 (FR-RSN-03) */
export interface SaveRoutineRequest {
  name: string;
  stepCount: StepCount;
  skinTypeSnapshot: SkinType;
  steps: {
    timeOfDay: TimeOfDay;
    order: number;
    category: StepCategory;
    productId: string;
  }[];
}

// ---------- 리뷰 ----------

export type UsageDuration =
  | "UNDER_1_WEEK" // 1주 미만
  | "ONE_TO_4_WEEKS" // 1주~4주
  | "ONE_TO_3_MONTHS" // 1~3개월
  | "OVER_3_MONTHS"; // 3개월 이상

export type DissatisfactionTag =
  | "IRRITATION" // 자극
  | "GREASY" // 유분
  | "SCENT" // 향
  | "PRICE"; // 가격

export interface ReviewSummary {
  id: string;
  isPositive: boolean; // 좋아요(true) / 아쉬워요(false)
  usageDuration: UsageDuration;
  repurchaseIntent: boolean | null;
  dissatisfactionTags: DissatisfactionTag[];
  content: string | null;
  skinTypeSnapshot: SkinType; // 작성 시점 피부타입 (FR-REV-15)
  createdAt: string;
  recommendCount: number; // FR-REV-21
  isRecommendedByMe: boolean; // 비로그인이면 false (FR-REV-21)
  isMine: boolean; // 본인 리뷰는 추천 버튼 비활성 (FR-REV-20)
}

export interface CreateReviewRequest {
  productId: string;
  isPositive: boolean;
  usageDuration: UsageDuration;
  repurchaseIntent?: boolean;
  dissatisfactionTags?: DissatisfactionTag[]; // '아쉬워요'일 때만 (FR-REV-05)
  content?: string;
}

// ---------- 인증 (소셜 로그인 전용) ----------

export interface AuthUser {
  id: string;
  provider: AuthProvider;
  nickname: string;
  email: string | null; // 선택 동의한 경우만
  profileImageUrl: string | null;
  skinType: SkinType | null; // null이면 온보딩 전 (FR-AUTH-06)
  concernTags: ConcernTag[];
}

/** 소셜 인증 성공 후 서비스 자체 JWT 발급 응답 (FR-AUTH-03) */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
