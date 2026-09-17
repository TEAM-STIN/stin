import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/index';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── 성분 그룹 & 소속 성분 ─────────────────────────────
// 그룹은 "병용 규칙 / 고민 매핑에서 규칙이 갈리는 최소 단위".
// LHA(캡릴로일살리실산)는 살리실산 유도체라 BHA류에 성분으로 편입.

const INGREDIENTS: Record<string, string[]> = {
  레티노이드류: [
    '레티놀',
    '레티날',
    '레티닐팔미테이트',
    '하이드록시피나콜론레티노에이트',
  ],
  AHA류: ['글라이콜릭애씨드', '락틱애씨드', '만델릭애씨드'],
  BHA류: ['살리실산', '캡릴로일살리실산'],
  PHA류: ['글루코노락톤', '락토바이오닉애씨드'],
  '고농도 비타민C': [
    '아스코빅애씨드',
    '에틸아스코빅애씨드',
    '소듐아스코빌포스페이트',
    '아스코빌글루코사이드',
  ],
  나이아신아마이드: ['나이아신아마이드'],
  아젤라익애씨드: ['아젤라익애씨드'],
  트라넥삼산: ['트라넥삼산'],
  '진정·장벽 성분': [
    '세라마이드',
    '판테놀',
    '마데카소사이드',
    '아시아티코사이드',
    '베타글루칸',
    '알란토인',
    '비사보롤',
    '콜로이달오트밀',
  ],
  '코메도제닉 오일·에스터': [
    '코코넛오일',
    '코코아버터',
    '이소프로필미리스테이트',
    '이소프로필팔미테이트',
    '미리스틸미리스테이트',
    '라놀린',
  ],
  '자극 유발 성분': [
    '변성알코올',
    '멘톨',
    '캠퍼',
    '유칼립투스오일',
    '페퍼민트오일',
  ],
};

// ── 성분 그룹 병용 규칙 ──────────────────────────────

type Rule = {
  a: string;
  b: string;
  severity: 'BLOCK' | 'WARN';
  evidenceLevel: 'ESTABLISHED' | 'COMMON_BELIEF' | 'ANECDOTAL';
  description: string;
};

const RULES: Rule[] = [
  {
    a: '레티노이드류',
    b: 'AHA류',
    severity: 'BLOCK',
    evidenceLevel: 'ESTABLISHED',
    description:
      '레티노이드와 AHA를 함께 쓰면 피부 장벽이 손상되고 자극이 커질 수 있어요.',
  },
  {
    a: '레티노이드류',
    b: 'BHA류',
    severity: 'BLOCK',
    evidenceLevel: 'ESTABLISHED',
    description: '레티노이드와 BHA를 함께 쓰면 건조와 자극이 쌓일 수 있어요.',
  },
  {
    a: '레티노이드류',
    b: 'PHA류',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      'PHA는 저자극이지만 레티노이드와 같은 시간대에 쓰면 자극이 늘 수 있어, 시간대를 나누면 부담을 줄일 수 있어요.',
  },
  {
    a: '레티노이드류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      '레티노이드와 고농도 비타민C는 최적 pH가 달라, 아침·저녁으로 나눠 쓰면 각각의 효과를 지킬 수 있어요.',
  },
  {
    a: 'AHA류',
    b: 'BHA류',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      'AHA와 BHA를 같은 시간대에 쓰면 각질 제거가 과해질 수 있어, 시간대를 나누면 장벽 손상을 줄일 수 있어요.',
  },
  {
    a: '나이아신아마이드',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      '나이아신아마이드와 고농도 비타민C를 함께 쓰면 변색·효능 저하가 생긴다는 통설이 있지만, 최근 연구에서는 대부분 반박되고 있어 참고 수준으로 볼 수 있어요.',
  },
  {
    a: 'AHA류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'ANECDOTAL',
    description:
      'AHA와 고농도 비타민C를 함께 쓰면 자극이 늘었다는 사용자 후기가 많지만, 공식 임상 근거보다는 경험적 보고에 가깝다고 볼 수 있어요.',
  },
  {
    a: 'BHA류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'ANECDOTAL',
    description:
      'BHA와 고농도 비타민C를 함께 쓰면 자극이 늘었다는 사용자 후기가 있지만, 경험적 보고 수준이라고 볼 수 있어요.',
  },
];

// ── 성분 그룹 ↔ 고민 매핑 ────────────────────────────
// weight: 핵심 100 / 보조 60 / 병행 25. AVOID 는 사용 안 함(0).
// 근거: docs/functional-ingredients.md

type Concern = {
  group: string;
  tag:
    | 'TROUBLE'
    | 'KERATIN'
    | 'PORE'
    | 'REDNESS'
    | 'SENSITIVE'
    | 'WRINKLE'
    | 'PIGMENTATION';
  effect: 'HELPS' | 'AVOID';
  evidenceLevel: 'ESTABLISHED' | 'COMMON_BELIEF' | 'ANECDOTAL';
  weight: number;
  description: string;
};

const CONCERNS: Concern[] = [
  // 레티노이드류
  {
    group: '레티노이드류',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      '레티노이드는 콜라겐 생성을 촉진하고 광노화를 개선해, 주름 개선에 가장 근거가 강한 도움을 받을 수 있어요.',
  },
  {
    group: '레티노이드류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      '레티노이드는 피부 턴오버를 높여 면포가 생기는 것을 예방할 수 있어요.',
  },
  {
    group: '레티노이드류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '레티노이드는 각질 축적을 줄이고 모공 벽 탄력을 높여 모공을 덜 도드라지게 할 수 있어요.',
  },
  {
    group: '레티노이드류',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      '레티노이드는 턴오버로 색소 배출을 돕고 다른 미백 성분의 침투를 보조할 수 있어요.',
  },
  {
    group: '레티노이드류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description:
      '레티노이드는 초기 자극(레티노이드 피부염)이 생길 수 있어, 민감성 피부에는 부담이 될 수 있어요.',
  },

  // AHA류
  {
    group: 'AHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      'AHA는 각질세포 간 결합을 분해해 표면 각질을 떨어뜨리고 피부결·톤을 개선할 수 있어요.',
  },
  {
    group: 'AHA류',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      'AHA는 각질 배출을 촉진해 표재성 색소침착을 옅게 할 수 있어요.',
  },
  {
    group: 'AHA류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 55,
    description: 'AHA는 표면 각질로 인한 모공 막힘을 완화할 수 있어요.',
  },
  {
    group: 'AHA류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 45,
    description:
      'AHA는 각질을 정리해 면포 완화에 보조적으로 도움을 줄 수 있어요.',
  },
  {
    group: 'AHA류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description:
      '고농도 AHA는 따가움·홍조 같은 자극이 생길 수 있어, 민감성 피부에는 부담이 될 수 있어요.',
  },
  {
    group: 'AHA류',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: 'AHA는 일시적으로 홍조와 자극을 유발할 수 있어요.',
  },

  // BHA류
  {
    group: 'BHA류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      'BHA(살리실산)는 지용성이라 모공 속 피지와 각질을 녹여 면포와 여드름을 개선할 수 있어요.',
  },
  {
    group: 'BHA류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 95,
    description:
      'BHA는 모공 내부의 피지·각질을 제거해 블랙헤드와 모공 막힘을 개선할 수 있어요.',
  },
  {
    group: 'BHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      'BHA는 지성·복합성 피부의 모공 주변 각질을 효과적으로 정리할 수 있어요.',
  },
  {
    group: 'BHA류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description:
      '고농도 BHA는 건조·자극을 유발할 수 있어, 민감성 피부에는 신중하게 쓰는 게 좋을 수 있어요.',
  },

  // PHA류
  {
    group: 'PHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      'PHA는 분자가 커서 침투가 얕아, 민감성 피부도 자극을 덜 느끼며 각질을 정리할 수 있어요.',
  },
  {
    group: 'PHA류',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 40,
    description:
      'PHA는 보습력이 있고 자극이 적어 민감성 피부의 순한 각질제거제로 쓸 수 있어요.',
  },

  // 고농도 비타민C
  {
    group: '고농도 비타민C',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      '비타민C(아스코빅애씨드)는 티로시나제를 억제하고 항산화 작용으로 색소침착을 개선할 수 있어요.',
  },
  {
    group: '고농도 비타민C',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description:
      '비타민C는 콜라겐 합성을 보조하고 산화 스트레스를 줄여 주름 예방에 도움을 줄 수 있어요.',
  },
  {
    group: '고농도 비타민C',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description:
      '고농도 비타민C는 낮은 pH 때문에 홍조·자극을 유발할 수 있어요.',
  },
  {
    group: '고농도 비타민C',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description:
      '고농도 비타민C는 따가움과 자극이 생길 수 있어, 민감성 피부에는 부담이 될 수 있어요.',
  },

  // 나이아신아마이드
  {
    group: '나이아신아마이드',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '나이아신아마이드는 피지 분비를 조절하고 항염 작용으로 트러블을 완화할 수 있어요.',
  },
  {
    group: '나이아신아마이드',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description:
      '나이아신아마이드는 피지 분비를 줄여 모공 외관을 개선할 수 있어요. 임상 근거가 있는 성분이에요.',
  },
  {
    group: '나이아신아마이드',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 80,
    description:
      '나이아신아마이드는 멜라닌소체가 각질세포로 전달되는 것을 차단해 색소침착을 완화할 수 있어요.',
  },
  {
    group: '나이아신아마이드',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      '나이아신아마이드는 염증 반응을 완화하고 장벽을 강화해 홍조를 줄일 수 있어요.',
  },
  {
    group: '나이아신아마이드',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 50,
    description:
      '나이아신아마이드는 장벽 지질 생성을 촉진해 민감성 피부의 장벽 회복을 도울 수 있어요(2~4% 권장).',
  },
  {
    group: '나이아신아마이드',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 45,
    description:
      '나이아신아마이드는 잔주름과 탄력 개선이 보고된 다기능 성분이라 주름 관리에 도움을 받을 수 있어요.',
  },

  // 아젤라익애씨드
  {
    group: '아젤라익애씨드',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '아젤라익애씨드는 항균·각질·항염 작용으로 염증성 트러블과 면포를 함께 개선할 수 있어요.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description:
      '아젤라익애씨드는 주사(rosacea)와 홍조 개선에 임상 근거가 강해 홍조 관리에 도움을 받을 수 있어요.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 70,
    description:
      '아젤라익애씨드는 티로시나제를 억제하고 염증후색소침착(PIH)을 개선할 수 있어요.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 50,
    description:
      '아젤라익애씨드는 각질과 피지를 정리해 모공 관리에 보조적으로 도움을 줄 수 있어요.',
  },

  // 트라넥삼산
  {
    group: '트라넥삼산',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '트라넥삼산은 국소 도포 시 기미와 염증후색소침착을 개선할 수 있어요. 관련 근거가 쌓여 있는 성분이에요.',
  },

  // 진정·장벽 성분
  {
    group: '진정·장벽 성분',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      '세라마이드·판테놀 등 장벽 성분은 손상된 피부 장벽을 복구해 자극 반응을 줄일 수 있어요.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 70,
    description:
      '센텔라·비사보롤 등 진정 성분은 염증과 혈관 반응을 완화해 홍조를 줄일 수 있어요.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description:
      '트러블 관리 중 장벽·진정 성분을 함께 쓰면 활성 성분의 자극을 완화할 수 있어요.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description:
      '각질제거 후 장벽 성분을 보충하면 자극과 건조를 줄일 수 있어요.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description:
      '레티노이드 사용 시 장벽 성분을 병행하면 자극을 완화할 수 있어요.',
  },

  // 코메도제닉 오일·에스터 (AVOID 전용)
  {
    group: '코메도제닉 오일·에스터',
    tag: 'TROUBLE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description:
      '코코넛오일·이소프로필미리스테이트 등 코메도제닉 성분은 모공을 막아 트러블을 악화시킬 수 있어요.',
  },
  {
    group: '코메도제닉 오일·에스터',
    tag: 'PORE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description:
      '코메도제닉 오일·에스터는 모공 막힘을 유발해 모공을 더 도드라지게 할 수 있어요.',
  },

  // 자극 유발 성분 (AVOID 전용)
  {
    group: '자극 유발 성분',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description:
      '향료·변성알코올·멘톨 등은 민감성 피부에 따가움과 자극을 유발할 수 있어요.',
  },
  {
    group: '자극 유발 성분',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description:
      '멘톨·캠퍼·에센셜오일 등 청량감·향 성분은 혈관을 자극해 홍조를 악화시킬 수 있어요.',
  },
];

// ── 성분 그룹 권장 시간대 ─────────────────────────────
// 값이 있는 그룹은 반대 시간대 루틴에 넣지 않는다 (FR-REC-07, 강제). 없는 그룹은 시간대 상관없음.
// 근거는 docs/functional-ingredients.md "성분 그룹 시간대 배치".

const GROUP_TIME_OF_DAY: Record<string, { time: 'AM' | 'PM'; reason: string }> =
  {
    레티노이드류: {
      time: 'PM',
      reason:
        '레티노이드는 빛에 쉽게 분해되고 초기 자극이 있어, 저녁에 쓰면 효과를 지키고 자극을 줄일 수 있어요.',
    },
    AHA류: {
      time: 'PM',
      reason:
        'AHA는 자외선에 대한 피부 민감도를 높여, 저녁에 쓰면 낮 동안의 자극을 줄일 수 있어요.',
    },
    BHA류: {
      time: 'PM',
      reason:
        'BHA는 각질을 녹이는 과정에서 자극이 생길 수 있어, 저녁에 쓰면 부담을 줄일 수 있어요.',
    },
    '고농도 비타민C': {
      time: 'AM',
      reason:
        '비타민C를 아침에 쓰면 낮 동안 자외선으로 생기는 산화 스트레스를 줄이는 데 도움을 받을 수 있어요.',
    },
  };

// ── 루틴 템플릿 ──────────────────────────────────────

// label은 같은 카테고리가 한 템플릿에 두 번 나올 때만 채운다 (4단계 세럼 2종, 요구사항 §4.3).
// 추천 단계 수는 모든 피부타입에서 3단계로 통일한다 (2026-09-17 결정, 온보딩 3단계 배지).
const TEMPLATES: Array<{
  stepCount: number;
  recommendedSkinTypes: string[];
  steps: Array<{ category: string; label?: string }>;
}> = [
  {
    stepCount: 2,
    recommendedSkinTypes: [],
    steps: [{ category: 'TONER' }, { category: 'CREAM' }],
  },
  {
    stepCount: 3,
    recommendedSkinTypes: [
      'OILY',
      'DRY',
      'COMBINATION',
      'DEHYDRATED_OILY',
      'NORMAL',
    ],
    steps: [
      { category: 'TONER' },
      { category: 'SERUM' },
      { category: 'CREAM' },
    ],
  },
  {
    stepCount: 4,
    recommendedSkinTypes: [],
    steps: [
      { category: 'TONER' },
      { category: 'SERUM', label: '가벼운 세럼' },
      { category: 'SERUM', label: '고농축 세럼' },
      { category: 'CREAM' },
    ],
  },
];

async function main() {
  // 성분 그룹 + 성분
  const groupIdByName = new Map<string, string>();
  for (const [groupName, ingredientNames] of Object.entries(INGREDIENTS)) {
    const timeOfDay = {
      preferredTimeOfDay: GROUP_TIME_OF_DAY[groupName]?.time ?? null,
      timeOfDayReason: GROUP_TIME_OF_DAY[groupName]?.reason ?? null,
    };
    const group = await prisma.ingredientGroup.upsert({
      where: { name: groupName },
      update: timeOfDay,
      create: { name: groupName, ...timeOfDay },
    });
    groupIdByName.set(groupName, group.id);

    for (const name of ingredientNames) {
      await prisma.ingredient.upsert({
        where: { name },
        update: { groupId: group.id },
        create: { name, groupId: group.id },
      });
    }
  }

  // 병용 규칙
  for (const rule of RULES) {
    const groupAId = groupIdByName.get(rule.a)!;
    const groupBId = groupIdByName.get(rule.b)!;
    await prisma.ingredientRule.upsert({
      where: { groupAId_groupBId: { groupAId, groupBId } },
      update: {
        severity: rule.severity,
        evidenceLevel: rule.evidenceLevel,
        description: rule.description,
      },
      create: {
        groupAId,
        groupBId,
        severity: rule.severity,
        evidenceLevel: rule.evidenceLevel,
        description: rule.description,
      },
    });
  }

  // 고민 매핑
  for (const c of CONCERNS) {
    const groupId = groupIdByName.get(c.group)!;
    await prisma.ingredientGroupConcern.upsert({
      where: { groupId_concernTag: { groupId, concernTag: c.tag } },
      update: {
        effect: c.effect,
        evidenceLevel: c.evidenceLevel,
        weight: c.weight,
        description: c.description,
      },
      create: {
        groupId,
        concernTag: c.tag,
        effect: c.effect,
        evidenceLevel: c.evidenceLevel,
        weight: c.weight,
        description: c.description,
      },
    });
  }

  // 루틴 템플릿
  for (const t of TEMPLATES) {
    const existing = await prisma.routineTemplate.findFirst({
      where: { stepCount: t.stepCount },
    });
    if (existing) {
      // 이미 시드된 DB도 추천 피부타입이 바뀌도록 갱신한다
      await prisma.routineTemplate.update({
        where: { id: existing.id },
        data: { recommendedSkinTypes: t.recommendedSkinTypes as never },
      });
      // 이미 시드된 DB도 label이 채워지도록 순서·카테고리가 모두 맞는 단계만 갱신한다
      for (const [i, step] of t.steps.entries()) {
        await prisma.routineTemplateStep.updateMany({
          where: {
            templateId: existing.id,
            order: i + 1,
            category: step.category as never,
          },
          data: { label: step.label ?? null },
        });
      }
      continue;
    }

    await prisma.routineTemplate.create({
      data: {
        stepCount: t.stepCount,
        recommendedSkinTypes: t.recommendedSkinTypes as never,
        steps: {
          create: t.steps.map((step, i) => ({
            order: i + 1,
            category: step.category as never,
            label: step.label ?? null,
          })),
        },
      },
    });
  }

  console.log('시드 데이터 생성 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
