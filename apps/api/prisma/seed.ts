import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/index';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [retinol, ahaBha, vitaminC, niacinamide] = await Promise.all([
    prisma.ingredientGroup.upsert({
      where: { name: '레티놀류' },
      update: {},
      create: { name: '레티놀류' },
    }),
    prisma.ingredientGroup.upsert({
      where: { name: 'AHA/BHA류' },
      update: {},
      create: { name: 'AHA/BHA류' },
    }),
    prisma.ingredientGroup.upsert({
      where: { name: '고농도 비타민C' },
      update: {},
      create: { name: '고농도 비타민C' },
    }),
    prisma.ingredientGroup.upsert({
      where: { name: '나이아신아마이드' },
      update: {},
      create: { name: '나이아신아마이드' },
    }),
  ]);

  await Promise.all([
    prisma.ingredient.upsert({
      where: { name: '레티놀' },
      update: {},
      create: { name: '레티놀', groupId: retinol.id },
    }),
    prisma.ingredient.upsert({
      where: { name: '살리실산' },
      update: {},
      create: { name: '살리실산', groupId: ahaBha.id },
    }),
    prisma.ingredient.upsert({
      where: { name: '글라이콜릭애씨드' },
      update: {},
      create: { name: '글라이콜릭애씨드', groupId: ahaBha.id },
    }),
    prisma.ingredient.upsert({
      where: { name: '아스코빅애씨드' },
      update: {},
      create: { name: '아스코빅애씨드', groupId: vitaminC.id },
    }),
    prisma.ingredient.upsert({
      where: { name: '나이아신아마이드' },
      update: {},
      create: { name: '나이아신아마이드', groupId: niacinamide.id },
    }),
  ]);

  await Promise.all([
    prisma.ingredientRule.upsert({
      where: { groupAId_groupBId: { groupAId: retinol.id, groupBId: ahaBha.id } },
      update: {},
      create: {
        groupAId: retinol.id,
        groupBId: ahaBha.id,
        severity: 'BLOCK',
        evidenceLevel: 'ESTABLISHED',
        description: '레티놀과 AHA/BHA를 함께 사용하면 피부 장벽 손상과 자극 위험이 커집니다.',
      },
    }),
    prisma.ingredientRule.upsert({
      where: { groupAId_groupBId: { groupAId: retinol.id, groupBId: vitaminC.id } },
      update: {},
      create: {
        groupAId: retinol.id,
        groupBId: vitaminC.id,
        severity: 'WARN',
        evidenceLevel: 'COMMON_BELIEF',
        description: '레티놀과 고농도 비타민C는 pH 조건이 달라 함께 쓰면 효과가 떨어질 수 있습니다.',
      },
    }),
    prisma.ingredientRule.upsert({
      where: { groupAId_groupBId: { groupAId: niacinamide.id, groupBId: vitaminC.id } },
      update: {},
      create: {
        groupAId: niacinamide.id,
        groupBId: vitaminC.id,
        severity: 'WARN',
        evidenceLevel: 'COMMON_BELIEF',
        description:
          '나이아신아마이드와 고농도 비타민C를 함께 쓰면 변색·효능 저하가 생긴다는 업계 통설이 있으나, 최근 연구에서는 대부분 반박되고 있습니다.',
      },
    }),
    prisma.ingredientRule.upsert({
      where: { groupAId_groupBId: { groupAId: ahaBha.id, groupBId: vitaminC.id } },
      update: {},
      create: {
        groupAId: ahaBha.id,
        groupBId: vitaminC.id,
        severity: 'WARN',
        evidenceLevel: 'ANECDOTAL',
        description:
          'AHA/BHA와 고농도 비타민C를 함께 사용하면 자극이 늘었다는 사용자 후기가 다수 있어, 공식 임상 근거보다는 경험적 보고에 가깝습니다.',
      },
    }),
  ]);

  const templates: Array<{ stepCount: number; recommendedSkinTypes: string[]; steps: string[] }> = [
    { stepCount: 2, recommendedSkinTypes: ['DEHYDRATED_OILY', 'NORMAL'], steps: ['TONER', 'CREAM'] },
    { stepCount: 3, recommendedSkinTypes: ['OILY', 'COMBINATION'], steps: ['TONER', 'SERUM', 'CREAM'] },
    {
      stepCount: 4,
      recommendedSkinTypes: ['DRY'],
      steps: ['TONER', 'SERUM', 'SERUM', 'CREAM'],
    },
  ];

  for (const t of templates) {
    const existing = await prisma.routineTemplate.findFirst({ where: { stepCount: t.stepCount } });
    if (existing) continue;

    await prisma.routineTemplate.create({
      data: {
        stepCount: t.stepCount,
        recommendedSkinTypes: t.recommendedSkinTypes as never,
        steps: {
          create: t.steps.map((category, i) => ({
            order: i + 1,
            category: category as never,
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
