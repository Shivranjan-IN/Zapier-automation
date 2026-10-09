import "dotenv/config";
import express from "express";
import cors from "cors";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const client = new PrismaClient({ adapter });

// Allowed browser origins (comma-separated). Unset => reflect any origin (dev).
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const app = express();
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true
}));
app.use(express.json({
    verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    }
}));

app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "hooks" });
});

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

async function createRun(zapId: string, metadata: Record<string, unknown>) {
    return client.$transaction(async tx => {
        const run = await tx.zapRun.create({
            data: { zapId, metadata: metadata as unknown as Prisma.InputJsonValue }
        });

        await tx.zapRunOutbox.create({
            data: { zapRunId: run.id }
        });

        return run;
    });
}

function verifyGitHubSignature(secret: string, rawBody: Buffer | undefined, signatureHeader: string): boolean {
    if (!rawBody || !signatureHeader.startsWith("sha256=")) {
        return false;
    }
    const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    const expectedBuffer = Buffer.from(expected);
    const headerBuffer = Buffer.from(signatureHeader);
    return expectedBuffer.length === headerBuffer.length && timingSafeEqual(expectedBuffer, headerBuffer);
}

// https://hooks.zapier.com/hooks/catch/17043103/22b8496/
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
    const userId = Number(req.params.userId);
    const zapId = String(req.params.zapId);
    const body = req.body;

    try {
        const zap = await client.zap.findUnique({
            where: { id: zapId },
            include: { triggers: { include: { type: true } } }
        });
        if (!zap || zap.userId !== userId) {
            return res.status(404).json({ message: "Zap not found" });
        }

        const webhookTrigger = zap.triggers.find(t => t.type.name === "Webhook");
        if (!webhookTrigger) {
            return res.status(404).json({ message: "Zap has no Webhook trigger" });
        }

        const run = await createRun(zap.id, asRecord(body));

        return res.json({
            message: "Webhook received",
            runId: run.id
        });
    } catch (error) {
        console.error("[hooks] failed to store run:", error);
        return res.status(500).json({ message: "Failed to store run" });
    }
});

// GitHub webhook: repo Settings -> Webhooks -> payload URL /hooks/github/:zapId
app.post("/hooks/github/:zapId", async (req, res) => {
    const zapId = String(req.params.zapId);
    const event = String(req.headers["x-github-event"] ?? "");
    const signature = String(req.headers["x-hub-signature-256"] ?? "");

    try {
        const zap = await client.zap.findUnique({
            where: { id: zapId },
            include: { triggers: { include: { type: true } } }
        });

        const githubTrigger = zap?.triggers.find(t => t.type.name === "GitHub");
        if (!zap || !githubTrigger) {
            return res.status(404).json({ message: "GitHub Zap not found" });
        }

        const triggerMeta = asRecord(githubTrigger.metadata);
        const secret = typeof triggerMeta.secret === "string" ? triggerMeta.secret.trim() : "";

        if (secret) {
            const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;
            if (!verifyGitHubSignature(secret, rawBody, signature)) {
                return res.status(401).json({ message: "Invalid webhook signature" });
            }
        }

        if (event === "ping") {
            return res.json({ message: "pong" });
        }

        if (event !== "issue_comment" && event !== "pull_request_review_comment") {
            return res.status(202).json({ message: `Ignored event: ${event || "unknown"}` });
        }

        const body = asRecord(req.body);
        const action = typeof body.action === "string" ? body.action : "created";
        if (action !== "created") {
            return res.status(202).json({ message: `Ignored action: ${action}` });
        }

        const comment = asRecord(body.comment);
        const repository = asRecord(body.repository);
        const sender = asRecord(body.sender);
        const commentUser = asRecord(comment.user);

        const run = await createRun(zap.id, {
            event,
            action,
            repo: repository.full_name ?? "unknown/repo",
            author: commentUser.login ?? sender.login ?? "unknown",
            comment: comment.body ?? "",
            url: comment.html_url ?? "",
            issueNumber: asRecord(body.issue).number ?? asRecord(body.pull_request).number ?? null,
            receivedAt: new Date().toISOString()
        });

        return res.json({ message: "GitHub comment stored", runId: run.id });
    } catch (error) {
        console.error("[hooks] github hook failed:", error);
        return res.status(500).json({ message: "Failed to store run" });
    }
});

const port = Number(process.env.PORT || 3002);
app.listen(port, () => {
    console.log(`Hooks server is running on port ${port}`);
});
