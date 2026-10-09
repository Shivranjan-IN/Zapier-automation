import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { SignupSchema, SigninSchema } from "../types/types.js";
import { prismaClient } from "../db/index.js";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
  

const router = Router();

router.post("/signup", async (req, res) => {
    const body = req.body;
    const parsedData = SignupSchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Invalid input"
        });
    }

    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
        }
    })
    if (userExists) {
        return res.status(411).json({
            message: "User already exist"
        });
    }
    const hashedPassword = await bcrypt.hash(parsedData.data.password, SALT_ROUNDS);
    await prismaClient.user.create({
        data: {
            email: parsedData.data.username,
            password: hashedPassword,
            name: parsedData.data.name
        }
    });
    return res.status(200).json({
        message: "User created successfully"

    });
});


router.post("/signin", async (req, res) => {
    const body = req.body;
    const parsedData = SigninSchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Invalid input"
        });
    }
    // Find user by email only, then verify password hash
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
        }
    });
    if (!user) {
        return res.status(403).json({
            message: "Invalid email or password"
        });
    }
    const passwordMatch = await bcrypt.compare(parsedData.data.password, user.password);
    if (!passwordMatch) {
        return res.status(403).json({
            message: "Invalid email or password"
        });
    }
    // Token is unique per user because it encodes the user's unique id
    const token = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.json({
        token,
    });
})

    router.get("/", authMiddleware, async  (req, res) => {
        //@ts-ignore
        const id = parseInt(req.id);
        const user = await prismaClient.user.findFirst({
            where: {
                id: id
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        }) 
        res.json({
            user: user
        })
    });

    export const userRouter = router;
