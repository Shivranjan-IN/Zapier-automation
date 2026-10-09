import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TRIGGERS = [
    { name: "Webhook", image: "/icons/webhook.svg" },
    { name: "Schedule", image: "/icons/schedule.svg" },
    { name: "GitHub", image: "/icons/github.svg" },
];

const ACTIONS = [
    { name: "Send Email", image: "/icons/email.svg" },
    { name: "Slack Message", image: "/icons/slack.svg" },
    { name: "HTTP Request", image: "/icons/http.svg" },
    { name: "Delay", image: "/icons/delay.svg" },
    { name: "Filter", image: "/icons/filter.svg" },
    { name: "Google Sheets", image: "/icons/sheets.svg" },
];

// Legacy test rows kept so existing zaps/runs still resolve; repointed to canonical rows.
const TRIGGER_REPOINT: Record<string, string> = {
    "8d5d8fb5-d300-4637-8c87-262d74877505": "webhook",
};
const ACTION_REPOINT: Record<string, string> = {
    "7c4a8c1e-5d4e-4a2e-9c1b-123456789abc": "email",
    "34bf3ba1-fc5f-4d87-9e38-6f881954ccd4": "sol",
};
const CANONICAL_TRIGGER_ID = "webhook";
const CANONICAL_EMAIL_ID = "email";
const CANONICAL_SOL_ID = "sol";

async function main() {
    // 1. Rename legacy rows that become canonical entries
    const renameTrigger = await prisma.availableTrigger.findUnique({ where: { id: CANONICAL_TRIGGER_ID } });
    if (renameTrigger) {
        await prisma.availableTrigger.update({
            where: { id: CANONICAL_TRIGGER_ID },
            data: { name: "Webhook", image: "/icons/webhook.svg" },
        });
    }
    const renameEmail = await prisma.availableAction.findUnique({ where: { id: CANONICAL_EMAIL_ID } });
    if (renameEmail) {
        await prisma.availableAction.update({
            where: { id: CANONICAL_EMAIL_ID },
            data: { name: "Send Email", image: "/icons/email.svg" },
        });
    }
    const renameSol = await prisma.availableAction.findUnique({ where: { id: CANONICAL_SOL_ID } });
    if (renameSol) {
        await prisma.availableAction.update({
            where: { id: CANONICAL_SOL_ID },
            data: { name: "Solana Transfer", image: "/icons/solana.svg" },
        });
    }

    // 2. Repoint legacy references to canonical rows
    for (const [from, to] of Object.entries(TRIGGER_REPOINT)) {
        if (await prisma.availableTrigger.findUnique({ where: { id: to } })) {
            await prisma.trigger.updateMany({
                where: { triggerId: from },
                data: { triggerId: to },
            });
        }
    }
    for (const [from, to] of Object.entries(ACTION_REPOINT)) {
        if (await prisma.availableAction.findUnique({ where: { id: to } })) {
            await prisma.action.updateMany({
                where: { actionId: from },
                data: { actionId: to },
            });
        }
    }

    // 3. Delete catalog rows no longer referenced
    const usedTriggers = await prisma.trigger.findMany({ select: { triggerId: true } });
    const usedActions = await prisma.action.findMany({ select: { actionId: true } });
    const usedTriggerIds = new Set(usedTriggers.map(t => t.triggerId));
    const usedActionIds = new Set(usedActions.map(a => a.actionId));

    const canonicalTriggerNames = new Set(TRIGGERS.map(t => t.name));
    const canonicalActionNames = new Set([...ACTIONS.map(a => a.name), "Solana Transfer"]);
    for (const t of await prisma.availableTrigger.findMany()) {
        if (!usedTriggerIds.has(t.id) && !canonicalTriggerNames.has(t.name)) {
            await prisma.availableTrigger.delete({ where: { id: t.id } });
        }
    }
    for (const a of await prisma.availableAction.findMany()) {
        if (!usedActionIds.has(a.id) && !canonicalActionNames.has(a.name)) {
            await prisma.availableAction.delete({ where: { id: a.id } });
        }
    }

    // 4. Insert missing canonical entries (idempotent by name)
    for (const t of TRIGGERS) {
        const existing = await prisma.availableTrigger.findFirst({ where: { name: t.name } });
        if (!existing) {
            await prisma.availableTrigger.create({ data: t });
        } else {
            await prisma.availableTrigger.update({ where: { id: existing.id }, data: { image: t.image } });
        }
    }
    for (const a of ACTIONS) {
        const existing = await prisma.availableAction.findFirst({ where: { name: a.name } });
        if (!existing) {
            await prisma.availableAction.create({ data: a });
        } else {
            await prisma.availableAction.update({ where: { id: existing.id }, data: { image: a.image } });
        }
    }

    const triggers = await prisma.availableTrigger.findMany({ orderBy: { name: "asc" } });
    const actions = await prisma.availableAction.findMany({ orderBy: { name: "asc" } });
    console.log("Triggers:", triggers.map(t => `${t.id} -> ${t.name}`));
    console.log("Actions:", actions.map(a => `${a.id} -> ${a.name}`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
