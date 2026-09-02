-- CreateEnum
CREATE TYPE "ConcernEffect" AS ENUM ('HELPS', 'AVOID');

-- CreateTable
CREATE TABLE "IngredientGroupConcern" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "concernTag" "ConcernTag" NOT NULL,
    "effect" "ConcernEffect" NOT NULL,
    "evidenceLevel" "EvidenceLevel" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientGroupConcern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngredientGroupConcern_groupId_concernTag_key" ON "IngredientGroupConcern"("groupId", "concernTag");

-- AddForeignKey
ALTER TABLE "IngredientGroupConcern" ADD CONSTRAINT "IngredientGroupConcern_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngredientGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
