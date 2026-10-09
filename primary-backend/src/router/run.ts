import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { prismaClient } from "../db/index.js";

const router = Router();

const stepsInclude = {
    orderBy: { sortingOrder: "asc" as const },
    include: {
        action: {
            include: {
                type: true
            }
        }
    }
};

router.get("/", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = parseInt(req.id);

    const runs = await prismaClient.zapRun.findMany({
        where: {
            zap: {
                userId
            }
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
            steps: stepsInclude,
            zap: {
                include: {
                    triggers: {
                        include: {
                            type: true
                        }
                    },
                    actions: true
                }
            }
        }
    });

    return res.json({ runs });
});

router.get("/:runId", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = parseInt(req.id);
    const runId = String(req.params.runId);

    const run = await prismaClient.zapRun.findFirst({
        where: {
            id: runId,
            zap: {
                userId
            }
        },
        include: {
            steps: stepsInclude,
            zap: {
                include: {
                    triggers: {
                        include: {
                            type: true
                        }
                    },
                    actions: true
                }
            }
        }
    });

    if (!run) {
        return res.status(404).json({
            message: "Run not found"
        });
    }

    return res.json({ run });
});

export const runRouter = router;
