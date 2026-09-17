-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('KAKAO');

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "provider" "AuthProvider" NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

