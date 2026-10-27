import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  diagnosticAttempts,
  exerciseAttempts,
  exercises,
  lessonCompletions,
  lessons,
  users,
} from "../db/schema.js";
import { computeLessonStatuses } from "./lessonStatusService.js";
import { getOrderedLessons } from "./progressionService.js";
import { dateKeyInStreakZone } from "./streakService.js";

const DEFAULT_STREAK_TIME_ZONE = "Asia/Kolkata";
const MAX_CONTEXT_CHARS = 1000;

export type ChatDiagnosticSummary = {
  level: string;
  score: number;
  totalQuestions: number;
  percentage: number;
};

export type ChatWeakConcept = {
  slug: string;
  correct: number;
  total: number;
};

export type ChatDayActivity = {
  date: string;
  lessonsCompleted: number;
  exercisesAnswered: number;
  correct: number;
};

export type ChatRecentLesson = {
  title: string;
  accuracy: number;
  date: string;
};

export type ChatContextData = {
  firstName: string | null;
  latestDiagnostic: ChatDiagnosticSummary | null;
  xp: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
  completedLessons: number | null;
  totalLessons: number | null;
  weakestConcepts: ChatWeakConcept[];
  last7Days: ChatDayActivity[];
  previous7Days: { exercisesAnswered: number; correct: number } | null;
  recentLessons: ChatRecentLesson[];
  nextLessonTitle: string | null;
};

function streakTimeZone(): string {
  return process.env.STREAK_TZ || DEFAULT_STREAK_TIME_ZONE;
}

function firstNameOnly(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];

  return first || null;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function recentDateKeys(today: string, count: number, offset: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftDateKey(today, -(offset + index)),
  );
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function percentage(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function buildWeakestConcepts(
  attempts: Array<{
    exerciseId: string;
    conceptSlug: string;
    correct: boolean;
  }>,
): ChatWeakConcept[] {
  const firstAttemptByExercise = new Map<
    string,
    { conceptSlug: string; correct: boolean }
  >();

  // Attempts arrive oldest first, so the first row seen for an exercise is
  // its first try.
  for (const attempt of attempts) {
    if (!firstAttemptByExercise.has(attempt.exerciseId)) {
      firstAttemptByExercise.set(attempt.exerciseId, {
        conceptSlug: attempt.conceptSlug,
        correct: attempt.correct,
      });
    }
  }

  const byConcept = new Map<string, ChatWeakConcept>();

  for (const attempt of firstAttemptByExercise.values()) {
    const entry = byConcept.get(attempt.conceptSlug) ?? {
      slug: attempt.conceptSlug,
      correct: 0,
      total: 0,
    };

    entry.total += 1;

    if (attempt.correct) {
      entry.correct += 1;
    }

    byConcept.set(attempt.conceptSlug, entry);
  }

  return [...byConcept.values()]
    .sort((a, b) => {
      const accuracyDiff =
        a.correct / a.total - b.correct / b.total;

      if (accuracyDiff !== 0) return accuracyDiff;
      if (a.total !== b.total) return b.total - a.total;

      return a.slug.localeCompare(b.slug);
    })
    .slice(0, 3);
}

function emptyContext(): ChatContextData {
  return {
    firstName: null,
    latestDiagnostic: null,
    xp: null,
    currentStreak: null,
    longestStreak: null,
    completedLessons: null,
    totalLessons: null,
    weakestConcepts: [],
    last7Days: [],
    previous7Days: null,
    recentLessons: [],
    nextLessonTitle: null,
  };
}

export async function loadUserContext(
  userId: string,
  now: Date = new Date(),
): Promise<ChatContextData> {
  const [userRows, diagnosticRows, orderedLessons, completionRows, attemptRows] =
    await Promise.all([
      db
        .select({
          name: users.name,
          xp: users.xp,
          currentStreak: users.streakCount,
          longestStreak: users.longestStreak,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          level: diagnosticAttempts.placementLevel,
          score: diagnosticAttempts.score,
          totalQuestions: diagnosticAttempts.totalQuestions,
          percentage: diagnosticAttempts.percentage,
        })
        .from(diagnosticAttempts)
        .where(eq(diagnosticAttempts.userId, userId))
        .orderBy(desc(diagnosticAttempts.createdAt))
        .limit(1),
      getOrderedLessons(),
      db
        .select({
          lessonId: lessonCompletions.lessonId,
          title: lessons.title,
          accuracy: lessonCompletions.accuracyPercent,
          createdAt: lessonCompletions.createdAt,
        })
        .from(lessonCompletions)
        .innerJoin(lessons, eq(lessonCompletions.lessonId, lessons.id))
        .where(eq(lessonCompletions.userId, userId))
        .orderBy(
          desc(lessonCompletions.createdAt),
          desc(lessonCompletions.id),
        ),
      db
        .select({
          exerciseId: exerciseAttempts.exerciseId,
          conceptSlug: exercises.conceptSlug,
          correct: exerciseAttempts.correct,
          createdAt: exerciseAttempts.createdAt,
        })
        .from(exerciseAttempts)
        .innerJoin(exercises, eq(exerciseAttempts.exerciseId, exercises.id))
        .where(eq(exerciseAttempts.userId, userId))
        .orderBy(
          asc(exerciseAttempts.createdAt),
          asc(exerciseAttempts.id),
        ),
    ]);

  const user = userRows[0];

  if (!user) {
    return emptyContext();
  }

  const completedLessonIds = new Set(
    completionRows.map((completion) => completion.lessonId),
  );
  const orderedWithStatus = computeLessonStatuses(
    orderedLessons,
    completedLessonIds,
  );
  const nextLesson = orderedWithStatus.find(
    (lesson) => lesson.status === "AVAILABLE",
  );

  const today = dateKeyInStreakZone(now);
  const currentDateKeys = new Set(recentDateKeys(today, 7, 0));
  const previousDateKeys = new Set(recentDateKeys(today, 7, 7));
  const currentDays = new Map<string, ChatDayActivity>();
  let previousExercisesAnswered = 0;
  let previousCorrect = 0;

  const currentDay = (date: string): ChatDayActivity => {
    const existing = currentDays.get(date);

    if (existing) return existing;

    const created = {
      date,
      lessonsCompleted: 0,
      exercisesAnswered: 0,
      correct: 0,
    };

    currentDays.set(date, created);

    return created;
  };

  for (const completion of completionRows) {
    const date = dateKeyInStreakZone(completion.createdAt);

    if (currentDateKeys.has(date)) {
      currentDay(date).lessonsCompleted += 1;
    }
  }

  for (const attempt of attemptRows) {
    const date = dateKeyInStreakZone(attempt.createdAt);

    if (currentDateKeys.has(date)) {
      const day = currentDay(date);

      day.exercisesAnswered += 1;

      if (attempt.correct) day.correct += 1;
    } else if (previousDateKeys.has(date)) {
      previousExercisesAnswered += 1;

      if (attempt.correct) previousCorrect += 1;
    }
  }

  const diagnostic = diagnosticRows[0];

  return {
    firstName: firstNameOnly(user.name),
    latestDiagnostic: diagnostic
      ? {
          level: diagnostic.level,
          score: diagnostic.score,
          totalQuestions: diagnostic.totalQuestions,
          percentage: diagnostic.percentage,
        }
      : null,
    xp: user.xp,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    completedLessons: completedLessonIds.size,
    totalLessons: orderedLessons.length,
    weakestConcepts: buildWeakestConcepts(attemptRows),
    last7Days: [...currentDays.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    previous7Days:
      previousExercisesAnswered > 0
        ? {
            exercisesAnswered: previousExercisesAnswered,
            correct: previousCorrect,
          }
        : null,
    recentLessons: completionRows.slice(0, 5).map((completion) => ({
      title: completion.title,
      accuracy: completion.accuracy,
      date: dateKeyInStreakZone(completion.createdAt),
    })),
    nextLessonTitle: nextLesson?.title ?? null,
  };
}

function formatNumber(value: number | null): string {
  return value === null ? "no data yet" : String(value);
}

export function formatContext(data: ChatContextData): string {
  const lines: string[] = [
    `Name: ${data.firstName ?? "no data yet"}`,
  ];

  if (data.latestDiagnostic) {
    lines.push(
      `Level: ${data.latestDiagnostic.level} | Diagnostic: ${data.latestDiagnostic.score}/${data.latestDiagnostic.totalQuestions} (${data.latestDiagnostic.percentage}%)`,
    );
  } else {
    lines.push("Level: no data yet | Diagnostic: no data yet");
  }

  lines.push(`XP: ${formatNumber(data.xp)}`);

  if (data.currentStreak === null && data.longestStreak === null) {
    lines.push("Streak: no data yet");
  } else {
    const current =
      data.currentStreak === null
        ? "no data yet"
        : `${data.currentStreak} days current`;
    const longest =
      data.longestStreak === null
        ? "no data yet"
        : `${data.longestStreak} days longest`;

    lines.push(`Streak: ${current}, ${longest}`);
  }

  if (data.completedLessons === null || data.totalLessons === null) {
    lines.push("Lessons completed: no data yet");
  } else {
    lines.push(
      `Lessons completed: ${data.completedLessons} of ${data.totalLessons}`,
    );
  }

  if (data.weakestConcepts.length === 0) {
    lines.push("Weakest concepts (first try): no data yet");
  } else {
    lines.push(
      `Weakest concepts (first try): ${data.weakestConcepts
        .map(
          (concept) =>
            `${titleFromSlug(concept.slug)} ${percentage(concept.correct, concept.total)}% (${concept.correct}/${concept.total})`,
        )
        .join(", ")}`,
    );
  }

  lines.push(`Last 7 days (${streakTimeZone()}):`);

  if (data.last7Days.length === 0) {
    lines.push("  no data yet");
  } else {
    for (const day of data.last7Days) {
      const accuracy =
        day.exercisesAnswered > 0
          ? `, ${percentage(day.correct, day.exercisesAnswered)}% accuracy`
          : "";

      lines.push(
        `  ${day.date}: ${day.lessonsCompleted} lessons, ${day.exercisesAnswered} exercises${accuracy}`,
      );
    }
  }

  const currentExercises = data.last7Days.reduce(
    (sum, day) => sum + day.exercisesAnswered,
    0,
  );
  const currentCorrect = data.last7Days.reduce(
    (sum, day) => sum + day.correct,
    0,
  );

  if (currentExercises === 0 && !data.previous7Days) {
    lines.push("Accuracy compared with previous 7 days: no data yet");
  } else {
    const currentText =
      currentExercises > 0
        ? `${percentage(currentCorrect, currentExercises)}% (${currentCorrect}/${currentExercises})`
        : "no data yet";
    const previousText = data.previous7Days
      ? `${percentage(data.previous7Days.correct, data.previous7Days.exercisesAnswered)}% (${data.previous7Days.correct}/${data.previous7Days.exercisesAnswered})`
      : "no data yet";

    lines.push(
      `Accuracy last 7 days: ${currentText}; previous 7 days: ${previousText}`,
    );
  }

  if (data.recentLessons.length === 0) {
    lines.push("Recent lessons: no data yet");
  } else {
    lines.push(
      `Recent lessons: ${data.recentLessons
        .map(
          (lesson) =>
            `${lesson.title} (${lesson.accuracy}%, ${lesson.date})`,
        )
        .join("; ")}`,
    );
  }

  if (data.nextLessonTitle) {
    lines.push(`Next lesson: ${data.nextLessonTitle}`);
  } else if (
    data.completedLessons !== null &&
    data.totalLessons !== null &&
    data.totalLessons > 0 &&
    data.completedLessons >= data.totalLessons
  ) {
    lines.push("Next lesson: none (all lessons completed)");
  } else {
    lines.push("Next lesson: no data yet");
  }

  const text = lines.join("\n");

  if (text.length <= MAX_CONTEXT_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_CONTEXT_CHARS - 3).trimEnd()}...`;
}

export async function buildUserContext(userId: string): Promise<string> {
  return formatContext(await loadUserContext(userId));
}

export function buildQuickSummary(data: ChatContextData): string {
  const parts: string[] = ["Quick summary:"];

  if (data.latestDiagnostic) {
    parts.push(
      `You are at ${data.latestDiagnostic.level} level from your latest diagnostic (${data.latestDiagnostic.score}/${data.latestDiagnostic.totalQuestions}).`,
    );
  } else {
    parts.push("I do not have your diagnostic level yet.");
  }

  const xpText = data.xp === null ? "no XP data yet" : `${data.xp} XP`;
  const streakText =
    data.currentStreak === null
      ? "no streak data yet"
      : `${data.currentStreak} day current streak`;
  const longestText =
    data.longestStreak === null
      ? "no longest-streak data yet"
      : `${data.longestStreak} day longest streak`;

  parts.push(`You have ${xpText}, a ${streakText}, and a ${longestText}.`);

  if (data.completedLessons !== null && data.totalLessons !== null) {
    parts.push(
      `You have completed ${data.completedLessons} of ${data.totalLessons} lessons.`,
    );
  } else {
    parts.push("I do not have your lesson progress yet.");
  }

  const weekExercises = data.last7Days.reduce(
    (sum, day) => sum + day.exercisesAnswered,
    0,
  );
  const weekCorrect = data.last7Days.reduce(
    (sum, day) => sum + day.correct,
    0,
  );
  const weekLessons = data.last7Days.reduce(
    (sum, day) => sum + day.lessonsCompleted,
    0,
  );

  if (data.last7Days.length === 0) {
    parts.push("There is no activity data for the last 7 days yet.");
  } else {
    parts.push(
      `In the last 7 days you were active on ${data.last7Days.length} days, completed ${weekLessons} lessons, and answered ${weekExercises} exercises` +
        (weekExercises > 0
          ? ` with ${percentage(weekCorrect, weekExercises)}% accuracy.`
          : "."),
    );
  }

  if (data.previous7Days) {
    parts.push(
      `The previous 7 days had ${percentage(data.previous7Days.correct, data.previous7Days.exercisesAnswered)}% accuracy (${data.previous7Days.correct}/${data.previous7Days.exercisesAnswered}).`,
    );
  } else {
    parts.push("There is no comparison data for the previous 7 days yet.");
  }

  parts.push(
    data.nextLessonTitle
      ? `Your next lesson is ${data.nextLessonTitle}.`
      : "There is no next lesson available right now.",
  );
  parts.push("This is a quick summary from your saved progress.");

  return parts.join(" ");
}
