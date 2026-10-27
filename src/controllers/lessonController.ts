import type { Response } from "express";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  exerciseAttempts,
  exercises,
  lessonCompletions,
  lessonSessions,
  userLessonProgress,
  users,
} from "../db/schema.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import {
  computeAccuracy,
  computeXp,
  gradeAnswer,
  toClientLesson,
} from "../services/exerciseService.js";
import { computeLessonStatuses } from "../services/lessonStatusService.js";
import {
  getCompletedLessonIds,
  getLessonWithStatus,
  getOrderedLessons,
} from "../services/progressionService.js";
import { computeStreak } from "../services/streakService.js";

async function newlyUnlockedLessonIds(
  completedLessonId: string,
  completedBefore: Set<string>,
): Promise<string[]> {
  const orderedLessons = await getOrderedLessons();
  const completedAfter = new Set(completedBefore);

  completedAfter.add(completedLessonId);

  const before = computeLessonStatuses(orderedLessons, completedBefore);
  const after = computeLessonStatuses(orderedLessons, completedAfter);

  return after
    .filter(
      (lesson) =>
        lesson.status === "AVAILABLE" &&
        before.find((entry) => entry.id === lesson.id)?.status === "LOCKED",
    )
    .map((lesson) => lesson.id);
}

// GET /lessons/:id
export async function getLesson(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const lesson = await getLessonWithStatus(req.userId, String(req.params.id));

    if (!lesson) {
      return res.status(404).json({ error: { message: "Lesson not found" } });
    }

    if (lesson.status === "LOCKED") {
      return res
        .status(403)
        .json({ error: { message: "This lesson is locked" } });
    }

    const lessonExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.lessonId, lesson.id))
      .orderBy(asc(exercises.order));

    res.json(toClientLesson(lesson, lessonExercises));
  } catch (error) {
    console.error("Error fetching lesson:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}

// POST /lessons/:id/start
// Resumes the learner's most progressed open session for this lesson so an
// interrupted attempt keeps its answered exercises; a new session is only
// created when no session is open (e.g. the first start or a replay after
// completion). `completedExerciseIds` lets the frontend restore its queue.
export async function startLesson(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const lesson = await getLessonWithStatus(req.userId, String(req.params.id));

    if (!lesson) {
      return res.status(404).json({ error: { message: "Lesson not found" } });
    }

    if (lesson.status === "LOCKED") {
      return res
        .status(403)
        .json({ error: { message: "This lesson is locked" } });
    }

    const openSessions = await db
      .select({ id: lessonSessions.id, startedAt: lessonSessions.startedAt })
      .from(lessonSessions)
      .where(
        and(
          eq(lessonSessions.userId, req.userId),
          eq(lessonSessions.lessonId, lesson.id),
          isNull(lessonSessions.completedAt),
        ),
      )
      .orderBy(desc(lessonSessions.startedAt));

    let sessionId: string;
    const completedExerciseIds = new Set<string>();

    if (openSessions.length === 0) {
      const [session] = await db
        .insert(lessonSessions)
        .values({ userId: req.userId, lessonId: lesson.id })
        .returning({ id: lessonSessions.id });

      sessionId = session.id;
    } else {
      // Older data can contain several open sessions per lesson; resume the
      // one with the most correct exercises, breaking ties toward the most
      // recent start.
      const correctAttempts = await db
        .select({
          sessionId: exerciseAttempts.sessionId,
          exerciseId: exerciseAttempts.exerciseId,
        })
        .from(exerciseAttempts)
        .where(
          and(
            inArray(
              exerciseAttempts.sessionId,
              openSessions.map((session) => session.id),
            ),
            eq(exerciseAttempts.correct, true),
          ),
        );

      const correctBySession = new Map<string, Set<string>>();

      for (const attempt of correctAttempts) {
        const exercises = correctBySession.get(attempt.sessionId) ?? new Set();

        exercises.add(attempt.exerciseId);
        correctBySession.set(attempt.sessionId, exercises);
      }

      let bestSession = openSessions[0];
      let bestCount = correctBySession.get(bestSession.id)?.size ?? 0;

      for (const session of openSessions.slice(1)) {
        const count = correctBySession.get(session.id)?.size ?? 0;

        if (count > bestCount) {
          bestSession = session;
          bestCount = count;
        }
      }

      sessionId = bestSession.id;

      for (const exerciseId of correctBySession.get(sessionId) ?? []) {
        completedExerciseIds.add(exerciseId);
      }
    }

    res.status(201).json({
      sessionId,
      completedExerciseIds: [...completedExerciseIds],
    });
  } catch (error) {
    console.error("Error starting lesson:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}

// POST /exercises/:id/check
export async function checkExercise(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const { sessionId, answer } = req.body as {
      sessionId?: unknown;
      answer?: unknown;
    };

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      return res.status(400).json({ error: { message: "sessionId is required" } });
    }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, String(req.params.id)));

    if (!exercise) {
      return res.status(404).json({ error: { message: "Exercise not found" } });
    }

    const [session] = await db
      .select()
      .from(lessonSessions)
      .where(eq(lessonSessions.id, sessionId));

    if (!session) {
      return res.status(400).json({ error: { message: "Session not found" } });
    }

    if (session.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: { message: "Session does not belong to this user" } });
    }

    if (session.lessonId !== exercise.lessonId) {
      return res
        .status(400)
        .json({ error: { message: "Session does not match this exercise" } });
    }

    const outcome = gradeAnswer(exercise, answer);

    if (!outcome.ok) {
      return res.status(400).json({ error: { message: outcome.message } });
    }

    await db.insert(exerciseAttempts).values({
      sessionId: session.id,
      exerciseId: exercise.id,
      userId: req.userId,
      answer: outcome.answer,
      correct: outcome.isCorrect,
    });

    res.json({
      correct: outcome.isCorrect,
      explanation: exercise.explanation,
      ...(outcome.isCorrect || !outcome.correctAnswer
        ? {}
        : { correctAnswer: outcome.correctAnswer }),
    });
  } catch (error) {
    console.error("Error checking exercise:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}

// POST /lessons/:id/complete
export async function completeLesson(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const { sessionId } = req.body as { sessionId?: unknown };

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      return res.status(400).json({ error: { message: "sessionId is required" } });
    }

    const lesson = await getLessonWithStatus(req.userId, String(req.params.id));

    if (!lesson) {
      return res.status(404).json({ error: { message: "Lesson not found" } });
    }

    const [session] = await db
      .select()
      .from(lessonSessions)
      .where(eq(lessonSessions.id, sessionId));

    if (!session) {
      return res.status(400).json({ error: { message: "Session not found" } });
    }

    if (session.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: { message: "Session does not belong to this user" } });
    }

    if (session.lessonId !== lesson.id) {
      return res
        .status(400)
        .json({ error: { message: "Session does not match this lesson" } });
    }

    if (session.completedAt) {
      return res
        .status(400)
        .json({ error: { message: "Session is already completed" } });
    }

    const [user] = await db
      .select({
        xp: users.xp,
        streakCount: users.streakCount,
        longestStreak: users.longestStreak,
        lastActiveDate: users.lastActiveDate,
      })
      .from(users)
      .where(eq(users.id, req.userId));

    if (!user) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const lessonExercises = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.lessonId, lesson.id))
      .orderBy(asc(exercises.order));

    const attempts = await db
      .select({
        exerciseId: exerciseAttempts.exerciseId,
        correct: exerciseAttempts.correct,
      })
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.sessionId, session.id))
      .orderBy(asc(exerciseAttempts.createdAt), asc(exerciseAttempts.id));

    const correctExerciseIds = new Set(
      attempts
        .filter((attempt) => attempt.correct)
        .map((attempt) => attempt.exerciseId),
    );
    const missingCorrectAnswers = lessonExercises.filter(
      (exercise) => !correctExerciseIds.has(exercise.id),
    ).length;

    if (missingCorrectAnswers > 0) {
      return res.status(400).json({
        error: {
          message:
            "Every lesson exercise must be answered correctly before completing",
        },
      });
    }

    const accuracy = computeAccuracy(lessonExercises, attempts);

    const completedBefore = await getCompletedLessonIds(req.userId);

    const [existingCompletion] = await db
      .select({ id: lessonCompletions.id })
      .from(lessonCompletions)
      .where(
        and(
          eq(lessonCompletions.userId, req.userId),
          eq(lessonCompletions.lessonId, lesson.id),
        ),
      )
      .limit(1);

    const xpGained = computeXp(lesson.xpReward, accuracy, Boolean(existingCompletion));

    const now = new Date();
    const streak = computeStreak(
      user.streakCount,
      user.longestStreak,
      user.lastActiveDate,
      now,
    );

    const claimed = await db
      .update(lessonSessions)
      .set({ completedAt: now, xpAwarded: xpGained })
      .where(
        and(
          eq(lessonSessions.id, session.id),
          isNull(lessonSessions.completedAt),
        ),
      )
      .returning({ id: lessonSessions.id });

    if (claimed.length === 0) {
      return res
        .status(400)
        .json({ error: { message: "Session is already completed" } });
    }

    if (!existingCompletion) {
      await db.insert(lessonCompletions).values({
        userId: req.userId,
        lessonId: lesson.id,
        sessionId: session.id,
        accuracyPercent: Math.round(accuracy * 100),
        xpAwarded: xpGained,
      });
    }

    await db
      .insert(userLessonProgress)
      .values({
        userId: req.userId,
        lessonId: lesson.id,
        status: "COMPLETED",
        bestAccuracy: Math.round(accuracy * 100),
        completedAt: now,
      })
      .onConflictDoUpdate({
        target: [userLessonProgress.userId, userLessonProgress.lessonId],
        set: {
          status: "COMPLETED",
          bestAccuracy: sql`GREATEST(${userLessonProgress.bestAccuracy}, ${Math.round(accuracy * 100)})`,
          completedAt: sql`COALESCE(${userLessonProgress.completedAt}, ${now})`,
        },
      });

    await db
      .update(users)
      .set({
        xp: sql`${users.xp} + ${xpGained}`,
        streakCount: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: now,
      })
      .where(eq(users.id, req.userId));

    const newlyUnlocked = await newlyUnlockedLessonIds(
      lesson.id,
      completedBefore,
    );

    res.json({
      xpGained,
      accuracy,
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
      },
      newlyUnlocked,
    });
  } catch (error) {
    console.error("Error completing lesson:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}

// GET /me/progress
export async function getProgress(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const [user] = await db
      .select({
        xp: users.xp,
        streakCount: users.streakCount,
        longestStreak: users.longestStreak,
      })
      .from(users)
      .where(eq(users.id, req.userId));

    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const completedLessonIds = await getCompletedLessonIds(req.userId);

    res.json({
      totalXp: user.xp,
      currentStreak: user.streakCount,
      longestStreak: user.longestStreak,
      completedLessonIds: [...completedLessonIds],
    });
  } catch (error) {
    console.error("Error fetching progress:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}
