import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}

const userResponseColumns = {
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    language: users.language,
    currentLevel: users.currentLevel,
    xp: users.xp,
    streakCount: users.streakCount,
    lastActiveDate: users.lastActiveDate,
    placementReadinessScore: users.placementReadinessScore,
    avatarUrl: users.avatarUrl,
    portfolioSlug: users.portfolioSlug,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
};

function signToken(userId: string) {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /auth/register
export async function register(req: Request, res: Response) {
    const { email, password, name } = req.body as {
        email?: string;
        password?: string;
        name?: string;
    };

    if (!email || !password || !name) {
        return res.status(400).json({
            error: { message: "Email, password, and name are required" },
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: { message: "Password must be at least 8 characters" },
        });
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (existing) {
        return res.status(409).json({ error: { message: "Email already in use" } });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [createdUser] = await db.insert(users).values({ email, passwordHash, name }).returning(userResponseColumns);

    const token = signToken(createdUser.id);

    res.status(201).json({ user: createdUser, token });
}

// POST /auth/login
export async function login(req: Request, res: Response) {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
        return res.status(400).json({
            error: { message: "Email and password are required" },
        });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
        return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    const token = signToken(user.id);

    const { passwordHash: _omit, ...safeUser } = user;

    res.json({ user: safeUser, token });
}
