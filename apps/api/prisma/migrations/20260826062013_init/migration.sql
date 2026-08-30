-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('OILY', 'DRY', 'COMBINATION', 'DEHYDRATED_OILY', 'NORMAL');

-- CreateEnum
CREATE TYPE "ConcernTag" AS ENUM ('TROUBLE', 'KERATIN', 'PORE', 'REDNESS', 'SENSITIVE', 'WRINKLE', 'PIGMENTATION');

-- CreateEnum
CREATE TYPE "StepCategory" AS ENUM ('TONER', 'SERUM', 'CREAM', 'SUNSCREEN');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('BLOCK', 'WARN');

-- CreateEnum
CREATE TYPE "EvidenceLevel" AS ENUM ('ESTABLISHED', 'COMMON_BELIEF', 'ANECDOTAL');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('AM', 'PM');

-- CreateEnum
CREATE TYPE "UsageDuration" AS ENUM ('UNDER_1_WEEK', 'ONE_TO_4_WEEKS', 'ONE_TO_3_MONTHS', 'OVER_3_MONTHS');

-- CreateEnum
CREATE TYPE "DissatisfactionTag" AS ENUM ('IRRITATION', 'GREASY', 'SCENT', 'PRICE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "skinType" "SkinType",
    "concernTags" "ConcernTag"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StepCategory" NOT NULL,
    "price" INTEGER NOT NULL,
    "volumeMl" INTEGER,
    "imageUrl" TEXT,
    "isNoncomedogenic" BOOLEAN NOT NULL DEFAULT false,
    "suitableSkinTypes" "SkinType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIngredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IngredientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientRule" (
    "id" TEXT NOT NULL,
    "groupAId" TEXT NOT NULL,
    "groupBId" TEXT NOT NULL,
    "severity" "RuleSeverity" NOT NULL,
    "evidenceLevel" "EvidenceLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineTemplate" (
    "id" TEXT NOT NULL,
    "stepCount" INTEGER NOT NULL,
    "recommendedSkinTypes" "SkinType"[],

    CONSTRAINT "RoutineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineTemplateStep" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" "StepCategory" NOT NULL,
    "label" TEXT,

    CONSTRAINT "RoutineTemplateStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skinTypeSnapshot" "SkinType" NOT NULL,
    "stepCount" INTEGER NOT NULL,
    "includeSunscreen" BOOLEAN NOT NULL DEFAULT true,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineStep" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "timeOfDay" "TimeOfDay" NOT NULL,
    "order" INTEGER NOT NULL,
    "category" "StepCategory" NOT NULL,
    "productId" TEXT NOT NULL,
    "reasonText" TEXT NOT NULL,

    CONSTRAINT "RoutineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skinTypeSnapshot" "SkinType" NOT NULL,
    "isPositive" BOOLEAN NOT NULL,
    "usageDuration" "UsageDuration" NOT NULL,
    "repurchaseIntent" BOOLEAN,
    "dissatisfactionTags" "DissatisfactionTag"[],
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIngredient_productId_ingredientId_key" ON "ProductIngredient"("productId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientGroup_name_key" ON "IngredientGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientRule_groupAId_groupBId_key" ON "IngredientRule"("groupAId", "groupBId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "Review"("userId", "productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngredientGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientRule" ADD CONSTRAINT "IngredientRule_groupAId_fkey" FOREIGN KEY ("groupAId") REFERENCES "IngredientGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientRule" ADD CONSTRAINT "IngredientRule_groupBId_fkey" FOREIGN KEY ("groupBId") REFERENCES "IngredientGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplateStep" ADD CONSTRAINT "RoutineTemplateStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoutineTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineStep" ADD CONSTRAINT "RoutineStep_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineStep" ADD CONSTRAINT "RoutineStep_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
