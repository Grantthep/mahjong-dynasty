-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "demoBalance" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dragonMeter" INTEGER NOT NULL DEFAULT 0,
    "freeSpinsRemaining" INTEGER NOT NULL DEFAULT 0,
    "freeSpinsTotal" INTEGER NOT NULL DEFAULT 0,
    "freeSpinBet" INTEGER NOT NULL DEFAULT 0,
    "freeSpinsWin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "bet" INTEGER NOT NULL,
    "isFreeSpin" BOOLEAN NOT NULL DEFAULT false,
    "totalWin" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "freeSpinsAwarded" INTEGER NOT NULL DEFAULT 0,
    "dragonFortuneTriggers" INTEGER NOT NULL DEFAULT 0,
    "cascadeCount" INTEGER NOT NULL DEFAULT 0,
    "resultJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_userId_key" ON "GameSession"("userId");

-- CreateIndex
CREATE INDEX "Spin_userId_createdAt_idx" ON "Spin"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Spin_sessionId_idx" ON "Spin"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Spin_userId_requestId_key" ON "Spin"("userId", "requestId");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spin" ADD CONSTRAINT "Spin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spin" ADD CONSTRAINT "Spin_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
