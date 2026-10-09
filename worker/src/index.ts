import "dotenv/config";
import dns from "node:dns";
import http from "node:http";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Render free has no IPv6 egress. Prefer IPv4 for all outbound sockets so
// we never hang on an unreachable AAAA address (e.g. smtp.gmail.com).
dns.setDefaultResultOrder("ipv4first");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
        let value: unknown;
        if (key.startsWith("payload.")) {
            value = key
                .slice("payload.".length)
                .split(".")
                .reduce<unknown>((accumulator, part) => {
                    if (accumulator && typeof accumulator === "object") {
                        return (accumulator as Record<string, unknown>)[part];
                    }
                    return undefined;
                }, data);
        } else {
            value = data[key];
        }
        return value === undefined || value === null ? "" : String(value);
    });
}

let mailer: Transporter | null = null;

function getMailer(): Transporter | null {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
        return null;
    }
    if (!mailer) {
        mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 465),
            secure: true,
            auth: { user, pass },
            connectionTimeout: 15_000,
            greetingTimeout: 15_000,
            socketTimeout: 30_000
        });
    }
    return mailer;
}

async function sendRealEmail(config: Record<string, unknown>, triggerData: Record<string, unknown>) {
    const transport = getMailer();
    if (!transport) {
        throw new Error("SMTP is not configured: set SMTP_USER and SMTP_PASS in worker/.env");
    }

    const to = interpolate(String(config.to ?? "team@example.com"), triggerData);
    const subject = interpolate(String(config.subject ?? "Zapier automation alert"), triggerData);
    const body = interpolate(
        String(config.message ?? config.body ?? ""),
        triggerData
    );
    const configuredFrom = typeof config.from === "string" ? config.from.trim() : "";
    const from = configuredFrom
        ? interpolate(configuredFrom, triggerData)
        : process.env.SMTP_FROM || process.env.SMTP_USER || "";

    const info = await transport.sendMail({
        from,
        to,
        subject,
        text: body || subject
    });

    return {
        provider: "gmail-smtp",
        to,
        subject,
        from,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted
    };
}

async function sendResendEmail(params: { to: string; subject: string; text: string; fallbackFrom: string }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not set");
    }
    const from = process.env.RESEND_FROM || params.fallbackFrom || "onboarding@resend.dev";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from,
            to: [params.to],
            subject: params.subject,
            text: params.text || params.subject
        })
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
        throw new Error(
            `Resend API failed: HTTP ${response.status} ${JSON.stringify(data).slice(0, 300)}`
        );
    }
    return {
        provider: "resend",
        to: params.to,
        from,
        subject: params.subject,
        id: data.id
    };
}

async function appendToSheet(config: Record<string, unknown>, triggerData: Record<string, unknown>) {
    const url = String(config.webhookUrl ?? "").trim();
    if (!url || !/^https?:\/\//.test(url)) {
        throw new Error("Google Sheets action needs a valid Apps Script Webhook URL");
    }

    const rawValues = String(config.values ?? "");
    const values = rawValues.split(",").map(value => interpolate(value.trim(), triggerData));

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            values,
            source: "zapier-clone",
            timestamp: new Date().toISOString()
        })
    });

    const text = await response.text().catch(() => "");
    if (!response.ok) {
        throw new Error(
            `Google Sheets webhook failed: HTTP ${response.status} ${text.slice(0, 200)}`
        );
    }

    return {
        status: response.status,
        values,
        response: text.slice(0, 500)
    };
}

async function executeAction(
    name: string,
    config: Record<string, unknown>,
    triggerData: Record<string, unknown>
): Promise<Record<string, unknown>> {
    switch (name) {
        case "Delay": {
            const raw = Number(config.seconds ?? 1);
            const seconds = Math.min(Math.max(Number.isFinite(raw) ? raw : 1, 0), 5);
            await sleep(seconds * 1000);
            return { waitedSeconds: seconds };
        }
        case "Filter": {
            await sleep(150);
            const field = typeof config.field === "string" ? config.field : null;
            const expected = config.value ?? null;
            const received = field ? triggerData[field] ?? null : null;
            const matched = field ? received === expected : true;
            return { matched, field, expected, received };
        }
        case "Send Email": {
            const to = interpolate(String(config.to ?? "team@example.com"), triggerData);
            const subject = interpolate(
                String(config.subject ?? "Zapier automation alert"),
                triggerData
            );
            const body = interpolate(
                String(config.message ?? config.body ?? ""),
                triggerData
            );
            const configuredFrom = typeof config.from === "string" ? config.from.trim() : "";
            const fallbackFrom = configuredFrom
                ? interpolate(configuredFrom, triggerData)
                : process.env.SMTP_FROM || process.env.SMTP_USER || "";

            // Prefer Resend (HTTPS, works on Render free). Falls back to SMTP,
            // then to a simulated send if neither is configured.
            if (process.env.RESEND_API_KEY) {
                return await sendResendEmail({ to, subject, text: body, fallbackFrom });
            }

            if (getMailer()) {
                return await sendRealEmail(config, triggerData);
            }

            await sleep(300);
            return {
                provider: "simulated",
                simulated: true,
                note: "SMTP_USER/SMTP_PASS not set in worker/.env — simulated send",
                to,
                subject,
                message: body,
                messageId: `<${Date.now()}-${Math.random().toString(36).slice(2, 8)}@zap.mock>`,
                status: "sent"
            };
        }
        case "Google Sheets": {
            return await appendToSheet(config, triggerData);
        }
        case "Slack Message": {
            await sleep(250);
            return {
                channel: config.channel ?? "#general",
                text: config.text ?? "New event received",
                ts: Date.now().toString()
            };
        }
        case "HTTP Request": {
            await sleep(400);
            return {
                method: config.method ?? "POST",
                url: config.url ?? "https://example.com/webhook",
                status: 200,
                bodyBytes: 128
            };
        }
        default: {
            await sleep(200);
            return { action: name, echoedConfig: config, received: triggerData };
        }
    }
}

async function processRun(zapRunId: string) {
    const run = await prisma.zapRun.findUnique({
        where: { id: zapRunId },
        include: {
            zap: {
                include: {
                    triggers: { include: { type: true } },
                    actions: {
                        orderBy: { sortingOrder: "asc" },
                        include: { type: true }
                    }
                }
            }
        }
    });

    if (!run) {
        console.warn(`[worker] zapRun ${zapRunId} not found, skipping`);
        return;
    }

    if (run.status !== "PENDING") {
        console.log(`[worker] zapRun ${zapRunId} already ${run.status}, skipping`);
        return;
    }

    const triggerData = asRecord(run.metadata);
    const triggerName = run.zap.triggers?.[0]?.type.name ?? "unknown";
    console.log(`[worker] run ${zapRunId} started (trigger: ${triggerName}, actions: ${run.zap.actions.length})`);

    await prisma.zapRun.update({
        where: { id: run.id },
        data: { status: "RUNNING", startedAt: new Date() }
    });

    const actions = run.zap.actions;
    if (actions.length > 0) {
        await prisma.zapRunStep.createMany({
            data: actions.map(action => ({
                zapRunId: run.id,
                actionId: action.id,
                sortingOrder: action.sortingOrder,
                status: "PENDING"
            }))
        });
    }

    for (const action of actions) {
        const config = asRecord(action.metadata);
        const step = await prisma.zapRunStep.findFirst({
            where: { zapRunId: run.id, actionId: action.id }
        });
        if (!step) {
            continue;
        }

        await prisma.zapRunStep.update({
            where: { id: step.id },
            data: { status: "RUNNING", startedAt: new Date() }
        });

        try {
            const output = await executeAction(action.type.name, config, triggerData);

            if (config.simulateError === true) {
                throw new Error(String(config.errorMessage ?? `Simulated failure in "${action.type.name}"`));
            }
            if (config.chaos === true && Math.random() < 0.1) {
                throw new Error(`Random failure in "${action.type.name}"`);
            }

            await prisma.zapRunStep.update({
                where: { id: step.id },
                data: { status: "SUCCESS", finishedAt: new Date(), output: output as unknown as Prisma.InputJsonValue }
            });
            console.log(`[worker] run ${zapRunId} step "${action.type.name}" succeeded`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await prisma.zapRunStep.update({
                where: { id: step.id },
                data: { status: "FAILED", finishedAt: new Date(), error: message }
            });
            await prisma.zapRunStep.updateMany({
                where: { zapRunId: run.id, status: "PENDING" },
                data: { status: "SKIPPED" }
            });
            await prisma.zapRun.update({
                where: { id: run.id },
                data: { status: "FAILED", completedAt: new Date() }
            });
            console.log(`[worker] run ${zapRunId} failed at "${action.type.name}": ${message}`);
            return;
        }
    }

    await prisma.zapRun.update({
        where: { id: run.id },
        data: { status: "SUCCESS", completedAt: new Date() }
    });
    console.log(`[worker] run ${zapRunId} completed successfully`);
}

async function handleRun(zapRunId: string) {
    try {
        await processRun(zapRunId);
    } catch (error) {
        console.error(`[worker] unexpected error for run ${zapRunId}:`, error);
        try {
            await prisma.zapRun.updateMany({
                where: { id: zapRunId, status: { in: ["PENDING", "RUNNING"] } },
                data: { status: "FAILED", completedAt: new Date() }
            });
        } catch (dbError) {
            console.error("[worker] failed to mark run as FAILED:", dbError);
        }
    }
}

async function pollOutbox() {
    console.log("[worker] polling ZapRunOutbox every 2s (no Kafka)");
    while (true) {
        try {
            const pending = await prisma.zapRunOutbox.findMany({ take: 10 });
            for (const row of pending) {
                await handleRun(row.zapRunId);
                await prisma.zapRunOutbox.deleteMany({ where: { id: row.id } });
            }
        } catch (error) {
            console.error("[worker] outbox poll error:", error);
        }
        await sleep(2000);
    }
}

function startHealthServer() {
    const port = Number(process.env.PORT || 3003);
    const server = http.createServer((req, res) => {
        if (req.url === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, service: "worker" }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    server.listen(port, () => console.log(`[worker] health server listening on :${port}`));
}

async function main() {
    startHealthServer();
    await pollOutbox();
}

main().catch(error => {
    console.error("[worker] fatal:", error);
    process.exit(1);
});
