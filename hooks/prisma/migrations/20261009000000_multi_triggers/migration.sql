-- Drop the single-trigger pointer on Zap (data already lives in Trigger.zapId)
ALTER TABLE "Zap" DROP CONSTRAINT IF EXISTS "Zap_triggerId_fkey";
DROP INDEX IF EXISTS "Zap_triggerId_key";
ALTER TABLE "Zap" DROP COLUMN IF EXISTS "triggerId";

-- Trigger.zapId is no longer unique (a Zap can have many triggers)
DROP INDEX IF EXISTS "Trigger_zapId_key";
CREATE INDEX IF NOT EXISTS "Trigger_zapId_idx" ON "Trigger"("zapId");
