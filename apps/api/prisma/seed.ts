import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/index';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── 성분 그룹 & 소속 성분 ─────────────────────────────
// 그룹은 "병용 규칙 / 고민 매핑에서 규칙이 갈리는 최소 단위".
// LHA(캡릴로일살리실산)는 살리실산 유도체라 BHA류에 성분으로 편입.

const INGREDIENTS: Record<string, string[]> = {
  레티노이드류: ['레티놀', '레티날', '레티닐팔미테이트', '하이드록시피나콜론레티노에이트'],
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
  '자극 유발 성분': ['변성알코올', '멘톨', '캠퍼', '유칼립투스오일', '페퍼민트오일'],
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
    description: '레티노이드와 AHA를 함께 쓰면 피부 장벽 손상과 자극 위험이 커집니다.',
  },
  {
    a: '레티노이드류',
    b: 'BHA류',
    severity: 'BLOCK',
    evidenceLevel: 'ESTABLISHED',
    description: '레티노이드와 BHA를 함께 쓰면 건조와 자극이 누적됩니다.',
  },
  {
    a: '레티노이드류',
    b: 'PHA류',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      'PHA는 저자극이지만 레티노이드와 같은 시간대에 쓰면 자극이 늘 수 있어 분리 사용을 권합니다.',
  },
  {
    a: '레티노이드류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      '레티노이드와 고농도 비타민C는 최적 pH가 달라 함께 쓰면 효과가 떨어질 수 있어 아침·저녁으로 나눠 씁니다.',
  },
  {
    a: 'AHA류',
    b: 'BHA류',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      'AHA와 BHA를 같은 시간대에 함께 쓰면 각질제거가 과해져 장벽이 손상될 수 있어 시간대 분리를 권합니다.',
  },
  {
    a: '나이아신아마이드',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'COMMON_BELIEF',
    description:
      '나이아신아마이드와 고농도 비타민C를 함께 쓰면 변색·효능 저하가 생긴다는 통설이 있으나, 최근 연구에서는 대부분 반박되고 있습니다.',
  },
  {
    a: 'AHA류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'ANECDOTAL',
    description:
      'AHA와 고농도 비타민C를 함께 쓰면 자극이 늘었다는 사용자 후기가 많아, 공식 임상 근거보다는 경험적 보고에 가깝습니다.',
  },
  {
    a: 'BHA류',
    b: '고농도 비타민C',
    severity: 'WARN',
    evidenceLevel: 'ANECDOTAL',
    description:
      'BHA와 고농도 비타민C를 함께 쓰면 자극이 늘었다는 사용자 후기가 있어, 경험적 보고 수준입니다.',
  },
];

// ── 성분 그룹 ↔ 고민 매핑 ────────────────────────────
// weight: 핵심 100 / 보조 60 / 병행 25. AVOID 는 사용 안 함(0).
// 근거: docs/functional-ingredients.md

type Concern = {
  group: string;
  tag: 'TROUBLE' | 'KERATIN' | 'PORE' | 'REDNESS' | 'SENSITIVE' | 'WRINKLE' | 'PIGMENTATION';
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
    description: '레티노이드는 콜라겐 생성을 촉진하고 광노화를 개선해 주름 개선 근거가 가장 강합니다.',
  },
  {
    group: '레티노이드류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description: '레티노이드는 피부 턴오버를 높여 면포 형성을 예방합니다.',
  },
  {
    group: '레티노이드류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description: '레티노이드는 각질 축적을 줄이고 모공 벽 탄력을 높여 모공을 덜 도드라지게 합니다.',
  },
  {
    group: '레티노이드류',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description: '레티노이드는 턴오버로 색소 배출을 돕고 다른 미백 성분의 침투를 보조합니다.',
  },
  {
    group: '레티노이드류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: '레티노이드는 초기 자극(레티노이드 피부염) 위험이 있어 민감성 피부에는 권장하지 않습니다.',
  },

  // AHA류
  {
    group: 'AHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description: 'AHA는 각질세포 간 결합을 분해해 표면 각질을 탈락시키고 피부결·톤을 개선합니다.',
  },
  {
    group: 'AHA류',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description: 'AHA는 각질 배출을 촉진해 표재성 색소침착을 옅게 합니다.',
  },
  {
    group: 'AHA류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 55,
    description: 'AHA는 표면 각질로 인한 모공 막힘을 완화합니다.',
  },
  {
    group: 'AHA류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 45,
    description: 'AHA는 각질 정리로 면포를 완화하는 보조 역할을 합니다.',
  },
  {
    group: 'AHA류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: '고농도 AHA는 따가움·홍조 등 자극 위험이 있어 민감성 피부에는 권장하지 않습니다.',
  },
  {
    group: 'AHA류',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: 'AHA는 일시적으로 홍조와 자극을 유발할 수 있습니다.',
  },

  // BHA류
  {
    group: 'BHA류',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      'BHA(살리실산)는 지용성이라 모공 속 피지와 각질을 녹여 면포와 여드름을 개선합니다.',
  },
  {
    group: 'BHA류',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 95,
    description: 'BHA는 모공 내부의 피지·각질을 제거해 블랙헤드와 모공 막힘을 개선합니다.',
  },
  {
    group: 'BHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description: 'BHA는 지성·복합성 피부의 모공 주변 각질 정리에 효과적입니다.',
  },
  {
    group: 'BHA류',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: '고농도 BHA는 건조·자극을 유발할 수 있어 민감성 피부에는 신중해야 합니다.',
  },

  // PHA류
  {
    group: 'PHA류',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description:
      'PHA는 분자가 커서 침투가 얕아 저자극으로 각질을 정리하며, 민감성 피부의 각질 관리에 적합합니다.',
  },
  {
    group: 'PHA류',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 40,
    description: 'PHA는 보습력이 있고 자극이 적어 민감성 피부의 순한 각질제거제로 쓰입니다.',
  },

  // 고농도 비타민C
  {
    group: '고농도 비타민C',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description:
      '비타민C(아스코빅애씨드)는 티로시나제를 억제하고 항산화 작용으로 색소침착을 개선합니다.',
  },
  {
    group: '고농도 비타민C',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description:
      '비타민C는 콜라겐 합성을 보조하고 산화 스트레스를 줄여 주름 예방에 기여합니다.',
  },
  {
    group: '고농도 비타민C',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: '고농도 비타민C는 낮은 pH로 인해 홍조·자극을 유발할 수 있습니다.',
  },
  {
    group: '고농도 비타민C',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 0,
    description: '고농도 비타민C는 따가움과 자극 위험이 있어 민감성 피부에는 권장하지 않습니다.',
  },

  // 나이아신아마이드
  {
    group: '나이아신아마이드',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description: '나이아신아마이드는 피지 분비를 조절하고 항염 작용으로 트러블을 완화합니다.',
  },
  {
    group: '나이아신아마이드',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description: '나이아신아마이드는 피지 분비를 줄여 모공 외관을 개선하는 임상 근거가 있습니다.',
  },
  {
    group: '나이아신아마이드',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 80,
    description:
      '나이아신아마이드는 멜라닌소체가 각질세포로 전달되는 것을 차단해 색소침착을 완화합니다.',
  },
  {
    group: '나이아신아마이드',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 60,
    description: '나이아신아마이드는 염증 반응을 완화하고 장벽을 강화해 홍조를 줄입니다.',
  },
  {
    group: '나이아신아마이드',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 50,
    description:
      '나이아신아마이드는 장벽 지질 생성을 촉진해 민감성 피부의 장벽 회복을 돕습니다(2~4% 권장).',
  },
  {
    group: '나이아신아마이드',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 45,
    description: '나이아신아마이드는 잔주름과 탄력 개선이 보고된 다기능 성분입니다.',
  },

  // 아젤라익애씨드
  {
    group: '아젤라익애씨드',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '아젤라익애씨드는 항균·각질·항염 작용으로 염증성 트러블과 면포를 함께 개선합니다.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 85,
    description: '아젤라익애씨드는 주사(rosacea)와 홍조 개선에 대한 임상 근거가 강합니다.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 70,
    description: '아젤라익애씨드는 티로시나제를 억제하고 염증후색소침착(PIH)을 개선합니다.',
  },
  {
    group: '아젤라익애씨드',
    tag: 'PORE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 50,
    description: '아젤라익애씨드는 각질과 피지를 정리해 모공 관리에 보조적으로 도움이 됩니다.',
  },

  // 트라넥삼산
  {
    group: '트라넥삼산',
    tag: 'PIGMENTATION',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 90,
    description:
      '트라넥삼산은 국소 도포 시 기미와 염증후색소침착을 개선하는 근거가 축적되어 있습니다.',
  },

  // 진정·장벽 성분
  {
    group: '진정·장벽 성분',
    tag: 'SENSITIVE',
    effect: 'HELPS',
    evidenceLevel: 'ESTABLISHED',
    weight: 100,
    description: '세라마이드·판테놀 등 장벽 성분은 손상된 피부 장벽을 복구해 자극 반응을 줄입니다.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'REDNESS',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 70,
    description: '센텔라·비사보롤 등 진정 성분은 염증과 혈관 반응을 완화해 홍조를 줄입니다.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'TROUBLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description: '트러블 관리 중 장벽·진정 성분을 함께 쓰면 활성 성분의 자극을 완화합니다.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'KERATIN',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description: '각질제거 후 장벽 성분을 보충하면 자극과 건조를 줄일 수 있습니다.',
  },
  {
    group: '진정·장벽 성분',
    tag: 'WRINKLE',
    effect: 'HELPS',
    evidenceLevel: 'COMMON_BELIEF',
    weight: 25,
    description: '레티노이드 사용 시 장벽 성분을 병행하면 자극을 완화할 수 있습니다.',
  },

  // 코메도제닉 오일·에스터 (AVOID 전용)
  {
    group: '코메도제닉 오일·에스터',
    tag: 'TROUBLE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description:
      '코코넛오일·이소프로필미리스테이트 등 코메도제닉 성분은 모공을 막아 트러블을 악화시킬 수 있습니다.',
  },
  {
    group: '코메도제닉 오일·에스터',
    tag: 'PORE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description: '코메도제닉 오일·에스터는 모공 막힘을 유발해 모공을 더 도드라지게 할 수 있습니다.',
  },

  // 자극 유발 성분 (AVOID 전용)
  {
    group: '자극 유발 성분',
    tag: 'SENSITIVE',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description: '향료·변성알코올·멘톨 등은 민감성 피부에 따가움과 자극을 유발합니다.',
  },
  {
    group: '자극 유발 성분',
    tag: 'REDNESS',
    effect: 'AVOID',
    evidenceLevel: 'ESTABLISHED',
    weight: 0,
    description: '멘톨·캠퍼·에센셜오일 등 청량감·향 성분은 혈관을 자극해 홍조를 악화시킵니다.',
  },
];

// ── 루틴 템플릿 ──────────────────────────────────────

const TEMPLATES: Array<{ stepCount: number; recommendedSkinTypes: string[]; steps: string[] }> = [
  { stepCount: 2, recommendedSkinTypes: ['DEHYDRATED_OILY', 'NORMAL'], steps: ['TONER', 'CREAM'] },
  { stepCount: 3, recommendedSkinTypes: ['OILY', 'COMBINATION'], steps: ['TONER', 'SERUM', 'CREAM'] },
  { stepCount: 4, recommendedSkinTypes: ['DRY'], steps: ['TONER', 'SERUM', 'SERUM', 'CREAM'] },
];

async function main() {
  // 성분 그룹 + 성분
  const groupIdByName = new Map<string, string>();
  for (const [groupName, ingredientNames] of Object.entries(INGREDIENTS)) {
    const group = await prisma.ingredientGroup.upsert({
      where: { name: groupName },
      update: {},
      create: { name: groupName },
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
    const existing = await prisma.routineTemplate.findFirst({ where: { stepCount: t.stepCount } });
    if (existing) continue;

    await prisma.routineTemplate.create({
      data: {
        stepCount: t.stepCount,
        recommendedSkinTypes: t.recommendedSkinTypes as never,
        steps: {
          create: t.steps.map((category, i) => ({ order: i + 1, category: category as never })),
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
