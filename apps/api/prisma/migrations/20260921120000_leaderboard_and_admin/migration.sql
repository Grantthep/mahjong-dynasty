-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'PLAYER';

-- CreateIndex
CREATE INDEX "Spin_totalWin_idx" ON "Spin"("totalWin" DESC);

-- CreateIndex
CREATE INDEX "Spin_createdAt_idx" ON "Spin"("createdAt");
