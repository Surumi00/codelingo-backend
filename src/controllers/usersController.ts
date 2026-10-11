import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";

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
    occupation: users.occupation,
experienceLevel: users.experienceLevel,
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


export async function getMe(req: AuthRequest, res: Response) {
    if (!req.userId) {
        return res.status(401).json({
            error: { message: "Unauthorized" },
        });
    }

    const [user] = await db
        .select(userResponseColumns)
        .from(users)
        .where(eq(users.id, req.userId));

    if (!user) {
        return res.status(404).json({
            error: { message: "User not found" },
        });
    }

    res.json({ user });
}


export async function updateOnboarding(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: { message: "Unauthorized" },
            });
        }

        const { occupation, experienceLevel, language } = req.body as {
            occupation?: string;
            experienceLevel?: string;
            language?: string;
        };

        if (!occupation || typeof occupation !== "string") {
            return res.status(400).json({
                error: { message: "Occupation is required" },
            });
        }

        const allowedExperienceLevels = [
            "STUDENT",
            "BEGINNER",
            "SOME_EXPERIENCE",
            "EXPERIENCED",
        ] as const;

        if (
            !experienceLevel ||
            !allowedExperienceLevels.includes(
                experienceLevel as (typeof allowedExperienceLevels)[number]
            )
        ) {
            return res.status(400).json({
                error: {
                    message:
                        "Invalid experience level. Allowed values are STUDENT, BEGINNER, SOME_EXPERIENCE, EXPERIENCED",
                },
            });
        }

        if (language !== "PYTHON") {
            return res.status(400).json({
                error: {
                    message: "Only PYTHON is currently supported",
                },
            });
        }

        const [updatedUser] = await db
            .update(users)
            .set({
                occupation: occupation.trim(),
                experienceLevel:
                    experienceLevel as (typeof allowedExperienceLevels)[number],
                language: "PYTHON",
            })
            .where(eq(users.id, req.userId))
            .returning(userResponseColumns);

        if (!updatedUser) {
            return res.status(404).json({
                error: { message: "User not found" },
            });
        }

        return res.status(200).json({
            message: "Onboarding information saved successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating onboarding:", error);

        return res.status(500).json({
            error: { message: "Internal server error" },
        });
    }
}

// POST /auth/register
export async function register(req: Request, res: Response) {
    try{
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
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: { message: "Internal server error" } });
    }
    
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
