# 데이터 모델 요약

<!-- 이 파일은 `pnpm db:schema:doc`이 만든다. 손으로 고치지 말 것. -->
<!-- schema-hash: de4605dcd5997e2f -->

정본은 [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)다.
이 문서는 모델·필드·관계만 추린 요약이라, 인덱스나 제약 같은 세부는 원본을 봐야 한다.

모델 14개 · Enum 10개

## Enum

- **SkinType** — `OILY`(지성) · `DRY`(건성) · `COMBINATION`(복합성) · `DEHYDRATED_OILY`(수부지) · `NORMAL`(중성)
- **ConcernTag** — `TROUBLE`(트러블) · `KERATIN`(각질) · `PORE`(모공) · `REDNESS`(홍조) · `SENSITIVE`(민감) · `WRINKLE`(주름) · `PIGMENTATION`(색소침착)
- **StepCategory** — `TONER`(토너) · `SERUM`(세럼) · `CREAM`(크림) · `SUNSCREEN`(선크림 (향후 확장용, 현재 미사용 (요구사항 §4.3·§9)))
- **RuleSeverity** — `BLOCK`(절대 조건 위반 - 조합 자체를 폐기) · `WARN`(완화 가능 - 트레이드오프 처리 대상)
- **EvidenceLevel** — `ESTABLISHED`(공인 자료 기반) · `COMMON_BELIEF`(업계 통설) · `ANECDOTAL`(사용자 경험 기반)
- **ConcernEffect** — `HELPS`(해당 고민을 개선·완화) · `AVOID`(해당 고민을 악화시키거나 부적합)
- **TimeOfDay** — `AM`(아침) · `PM`(저녁)
- **UsageDuration** — `UNDER_1_WEEK`(1주 미만) · `ONE_TO_4_WEEKS`(1주~4주) · `ONE_TO_3_MONTHS`(1~3개월) · `OVER_3_MONTHS`(3개월 이상)
- **DissatisfactionTag** — `IRRITATION`(자극) · `GREASY`(유분) · `SCENT`(향) · `PRICE`(가격)
- **AuthProvider** — `KAKAO`(카카오 (요구사항 §10-2: 카카오 단일로 시작. 제공자 추가 시 값 추가))

## 모델

### User

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `provider` | `AuthProvider` |  |
| `providerId` | `String?` | 제공자가 발급한 계정 고유 ID. 탈퇴 시 비워 같은 계정으로 재가입하면 새 사용자가 된다 |
| `email` | `String?` | 선택 동의로 받은 경우만. 제공자 간 중복 가능해 unique 아님 |
| `nickname` | `String` | 제공자 값으로 초기화, 없으면 기본 닉네임 (FR-AUTH-05) |
| `profileImageUrl` | `String?` |  |
| `skinType` | `SkinType?` |  |
| `concernTags` | `ConcernTag[]` |  |
| `createdAt` | `DateTime` @default(now()) |  |
| `deletedAt` | `DateTime?` | 탈퇴 시각. null이면 활성 사용자 |

관계: `routines` → Routine[] · `reviews` → Review[] · `reviewRecommendations` → ReviewRecommendation[]

### Brand

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `name` | `String` @unique |  |

관계: `products` → Product[]

### Product

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `brandId` | `String` |  |
| `name` | `String` |  |
| `category` | `StepCategory` |  |
| `price` | `Int` | 원 단위 |
| `volumeMl` | `Int?` |  |
| `imageUrl` | `String?` |  |
| `isNoncomedogenic` | `Boolean` @default(false) | 논코메도제닉 여부 |
| `suitableSkinTypes` | `SkinType[]` |  |
| `createdAt` | `DateTime` @default(now()) |  |
| `updatedAt` | `DateTime` @updatedAt |  |

관계: `brand` → Brand · `ingredients` → ProductIngredient[] · `routineSteps` → RoutineStep[] · `reviews` → Review[]

### Ingredient

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `name` | `String` @unique |  |
| `groupId` | `String?` |  |

관계: `group` → IngredientGroup? · `products` → ProductIngredient[]

### ProductIngredient

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `productId` | `String` |  |
| `ingredientId` | `String` |  |
| `order` | `Int?` | 전성분 표기 순서 |

관계: `product` → Product · `ingredient` → Ingredient

### IngredientGroup

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `name` | `String` @unique | 예: "레티노이드류", "AHA류", "BHA류", "PHA류" |

관계: `ingredients` → Ingredient[] · `rulesAsA` → IngredientRule[] · `rulesAsB` → IngredientRule[] · `concerns` → IngredientGroupConcern[]

### IngredientGroupConcern

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `groupId` | `String` |  |
| `concernTag` | `ConcernTag` |  |
| `effect` | `ConcernEffect` |  |
| `evidenceLevel` | `EvidenceLevel` |  |
| `weight` | `Int` @default(100) | HELPS 추천 점수 가중치 (핵심 100 / 보조 60 / 병행 25). AVOID 는 무시 |
| `description` | `String` | 추천 근거 문장 생성에 쓰이는 설명 |
| `createdAt` | `DateTime` @default(now()) |  |

관계: `group` → IngredientGroup

### IngredientRule

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `groupAId` | `String` |  |
| `groupBId` | `String` |  |
| `severity` | `RuleSeverity` |  |
| `evidenceLevel` | `EvidenceLevel` |  |
| `description` | `String` | 근거 문장 생성에 쓰이는 설명 |
| `createdAt` | `DateTime` @default(now()) |  |

관계: `groupA` → IngredientGroup · `groupB` → IngredientGroup

### RoutineTemplate

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `stepCount` | `Int` @unique | 2 / 3 / 4. 단계 수마다 템플릿은 하나 (요구사항 §4.3 단계 구성 고정) |
| `recommendedSkinTypes` | `SkinType[]` | 온보딩3 "N단계 · O피부에 추천" 배지용 |

관계: `steps` → RoutineTemplateStep[]

### RoutineTemplateStep

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `templateId` | `String` |  |
| `order` | `Int` | 1,2,3... |
| `category` | `StepCategory` |  |
| `label` | `String?` | 예: "가벼운 세럼" / "고농축 세럼" 구분용 |

관계: `template` → RoutineTemplate

### Routine

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `userId` | `String` |  |
| `name` | `String` | 예: "지성・3단계 루틴", "환절기 재정비 루틴・4단계" |
| `skinTypeSnapshot` | `SkinType` | 저장 시점 피부타입 스냅샷 |
| `stepCount` | `Int` |  |
| `includeSunscreen` | `Boolean` @default(true) |  |
| `savedAt` | `DateTime` @default(now()) |  |

관계: `user` → User · `steps` → RoutineStep[]

### RoutineStep

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `routineId` | `String` |  |
| `timeOfDay` | `TimeOfDay` | AM / PM |
| `order` | `Int` |  |
| `category` | `StepCategory` |  |
| `productId` | `String` |  |
| `reasonText` | `String` | 추천 근거 문장 스냅샷 |

관계: `routine` → Routine · `product` → Product

### Review

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `userId` | `String` |  |
| `productId` | `String` |  |
| `skinTypeSnapshot` | `SkinType` | 작성 시점 피부타입 스냅샷 |
| `isPositive` | `Boolean` | 좋아요(true) / 아쉬워요(false) |
| `usageDuration` | `UsageDuration` |  |
| `repurchaseIntent` | `Boolean?` |  |
| `dissatisfactionTags` | `DissatisfactionTag[]` |  |
| `content` | `String?` |  |
| `createdAt` | `DateTime` @default(now()) |  |

관계: `user` → User · `product` → Product · `recommendations` → ReviewRecommendation[]

### ReviewRecommendation

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | `String` @id @default(cuid()) |  |
| `reviewId` | `String` |  |
| `userId` | `String` |  |
| `createdAt` | `DateTime` @default(now()) |  |

관계: `review` → Review · `user` → User

