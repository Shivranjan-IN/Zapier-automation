import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { prismaClient } from "../db/index.js";

const router = Router();

router.get("/triggers", authMiddleware, async (_req, res) => {
    const triggers = await prismaClient.availableTrigger.findMany({
        orderBy: { name: "asc" }
    });

    return res.json({ triggers });
});

router.get("/actions", authMiddleware, async (_req, res) => {
    const actions = await prismaClient.availableAction.findMany({
        orderBy: { name: "asc" }
    });

    return res.json({ actions });
});

export const availableRouter = router;
