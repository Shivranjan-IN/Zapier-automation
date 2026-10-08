import type { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "./config.js";
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }
    // Support both "Bearer <token>" and raw token
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload) {
            //@ts-ignore
            req.id = (payload as { id: number }).id;
            next();
        }
       
          
    } catch (error) {
        return res.status(403).json({
            message: "Unauthorized : you are not logged in"
        })
    }
}

// export const authMiddleware = authMiddleware;
