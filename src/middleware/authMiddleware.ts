import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
    userId?: string;
}

export function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader); // Debugging line

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: { message: "Authentication required" },
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            sub: string;
        };

        req.userId = decoded.sub;

        next();
    } catch (error) {
        return res.status(401).json({
            error: { message: "Invalid or expired token" },
        });
    }
}