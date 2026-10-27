import { describe, expect, it } from "vitest";
import {
  buildQuickSummary,
  formatContext,
  type ChatContextData,
} from "./chatContextService.js";

const fullData: ChatContextData = {
  firstName: "Ada",
  latestDiagnostic: {
    level: "INTERMEDIATE",
    score: 10,
    totalQuestions: 15,
    percentage: 67,
  },
  xp: 420,
  currentStreak: 5,
  longestStreak: 12,
  completedLessons: 4,
  totalLessons: 160,
  weakestConcepts: [
    { slug: "loops", correct: 2, total: 5 },
    { slug: "functions", correct: 3, total: 5 },
    { slug: "string-methods", correct: 1, total: 2 },
  ],
  last7Days: [
    {
      date: "2026-10-21",
      lessonsCompleted: 1,
      exercisesAnswered: 7,
      correct: 6,
    },
    {
      date: "2026-10-26",
      lessonsCompleted: 2,
      exercisesAnswered: 14,
      correct: 12,
    },
  ],
  previous7Days: { exercisesAnswered: 10, correct: 6 },
  recentLessons: [
    { title: "Variables", accuracy: 100, date: "2026-10-26" },
    { title: "Arithmetic Operators", accuracy: 86, date: "2026-10-25" },
    { title: "Strings", accuracy: 71, date: "2026-10-24" },
    { title: "Lists", accuracy: 100, date: "2026-10-23" },
    { title: "Loops", accuracy: 80, date: "2026-10-21" },
  ],
  nextLessonTitle: "Functions",
};

const noData: ChatContextData = {
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

describe("formatContext", () => {
  it("formats full data compactly and never includes private user fields", () => {
    const withPrivateFields = {
      ...fullData,
      email: "ada@private.example",
      id: "user_secret_id",
      token: "secret_token_value",
    } as ChatContextData & {
      email: string;
      id: string;
      token: string;
    };

    const text = formatContext(withPrivateFields);

    expect(text).toContain("Name: Ada");
    expect(text).toContain("Level: INTERMEDIATE | Diagnostic: 10/15 (67%)");
    expect(text).toContain("XP: 420");
    expect(text).toContain("Streak: 5 days current, 12 days longest");
    expect(text).toContain("Lessons completed: 4 of 160");
    expect(text).toContain("Loops 40% (2/5)");
    expect(text).toContain("Functions 60% (3/5)");
    expect(text).toContain("String Methods 50% (1/2)");
    expect(text).toContain(
      "2026-10-26: 2 lessons, 14 exercises, 86% accuracy",
    );
    expect(text).toContain(
      "Accuracy last 7 days: 86% (18/21); previous 7 days: 60% (6/10)",
    );
    expect(text).toContain("Variables (100%, 2026-10-26)");
    expect(text).toContain("Next lesson: Functions");
    expect(text).not.toContain(withPrivateFields.email);
    expect(text).not.toContain("user_secret_id");
    expect(text).not.toContain("secret_token_value");
    expect(text.length).toBeLessThan(1000);
  });

  it("uses 'no data yet' for every missing part", () => {
    const text = formatContext(noData);

    expect(text).toContain("Name: no data yet");
    expect(text).toContain("Level: no data yet | Diagnostic: no data yet");
    expect(text).toContain("XP: no data yet");
    expect(text).toContain("Streak: no data yet");
    expect(text).toContain("Lessons completed: no data yet");
    expect(text).toContain("Weakest concepts (first try): no data yet");
    expect(text).toContain("Last 7 days (Asia/Kolkata):\n  no data yet");
    expect(text).toContain(
      "Accuracy compared with previous 7 days: no data yet",
    );
    expect(text).toContain("Recent lessons: no data yet");
    expect(text).toContain("Next lesson: no data yet");
  });

  it("says no data for the level when there is no diagnostic", () => {
    const text = formatContext({ ...fullData, latestDiagnostic: null });

    expect(text).toContain("Level: no data yet | Diagnostic: no data yet");
    expect(text).toContain("XP: 420");
    expect(text).toContain("Lessons completed: 4 of 160");
  });
});

describe("buildQuickSummary", () => {
  it("builds a deterministic progress note from context data", () => {
    const summary = buildQuickSummary(fullData);

    expect(summary).toContain("Quick summary:");
    expect(summary).toContain("INTERMEDIATE level");
    expect(summary).toContain("420 XP");
    expect(summary).toContain("5 day current streak");
    expect(summary).toContain("4 of 160 lessons");
    expect(summary).toContain("86% accuracy");
    expect(summary).toContain("previous 7 days had 60% accuracy");
    expect(summary).toContain("next lesson is Functions");
    expect(summary).toContain("quick summary from your saved progress");
  });

  it("uses no-data wording when progress is missing", () => {
    const summary = buildQuickSummary(noData);

    expect(summary).toContain("do not have your diagnostic level");
    expect(summary).toContain("no XP data yet");
    expect(summary).toContain("no activity data for the last 7 days");
    expect(summary).toContain("no comparison data for the previous 7 days");
  });
});
