import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { ZapCreateSchema } from "../types/types.js";
import { prismaClient } from "../db/index.js";

const router = Router();
 
router.post("/", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: number = parseInt(req.id);
    const body = req.body;
    const parsedData = ZapCreateSchema.safeParse(body);
    
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        });
    }   

    const triggerInputs = parsedData.data.triggers?.length
        ? parsedData.data.triggers
        : [
              {
                  availableTriggerId: parsedData.data.availableTriggerId!,
                  triggerMetadata: parsedData.data.triggerMetadata
              }
          ];

    const zapId = await prismaClient.$transaction(async tx => {
        const zap = await tx.zap.create({
            data: {
                userId,
                actions: {
                    create: parsedData.data.actions.map((x, index) => ({
                        actionId: x.availableActionId,
                        sortingOrder: index,
                        metadata: x.actionMetadata ?? {}
                    }))
                }
            }
        });

        for (const triggerInput of triggerInputs) {
            await tx.trigger.create({
                data: {
                    triggerId: triggerInput.availableTriggerId,
                    zapId: zap.id,
                    metadata: triggerInput.triggerMetadata ?? {}
                }
            });
        }

        return zap.id;
    });
    return res.json({
        zapId
    })
})

router.get("/", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = parseInt(req.id);
    const zaps = await prismaClient.zap.findMany({
        where: {
            userId
        },
        include: {
            actions: {
               include: {
                   type: true
               },
               orderBy: { sortingOrder: "asc" }
            },
            triggers: {
                include: {
                    type: true
                }
            }
        }
    });

    return res.json({
        zaps
    })
})

router.get("/:zapId/runs", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = parseInt(req.id);
    const zapId = String(req.params.zapId);

    const zap = await prismaClient.zap.findFirst({
        where: {
            id: zapId,
            userId
        }
    });

    if (!zap) {
        return res.status(404).json({
            message: "Zap not found"
        });
    }

    const runs = await prismaClient.zapRun.findMany({
        where: {
            zapId: zap.id
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            steps: {
                orderBy: { sortingOrder: "asc" },
                include: {
                    action: {
                        include: {
                            type: true
                        }
                    }
                }
            }
        }
    });

    return res.json({ runs });
});

router.get("/:zapId", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = parseInt(req.id);
    const zapId = String(req.params.zapId);

    const zap = await prismaClient.zap.findFirst({
        where: {
            id: zapId,   
            userId
        },
        include: {
            actions: {
               include: {
                   type: true
               },
               orderBy: { sortingOrder: "asc" }
            },
            triggers: {
                include: {
                    type: true
                }
            }
        }
    });

    if (!zap) {
        return res.status(404).json({
            message: "Zap not found"
        });
    }

    return res.json({
        zap
    });

})

export const zapRouter = router;