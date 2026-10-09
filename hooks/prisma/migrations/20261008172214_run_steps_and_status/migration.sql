-- AlterTable
ALTER TABLE "ZapRun" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ZapRunStep" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "zapRunId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "sortingOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "output" JSONB,
    "error" TEXT,

    CONSTRAINT "ZapRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZapRunStep_zapRunId_idx" ON "ZapRunStep"("zapRunId");

-- AddForeignKey
ALTER TABLE "ZapRunStep" ADD CONSTRAINT "ZapRunStep_zapRunId_fkey" FOREIGN KEY ("zapRunId") REFERENCES "ZapRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZapRunStep" ADD CONSTRAINT "ZapRunStep_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
