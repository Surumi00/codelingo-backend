import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  serial,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["STUDENT", "ADMIN"]);

export const languageEnum = pgEnum("language", [
  "PYTHON",
  "JAVA",
  "JAVASCRIPT",
]);

export const skillLevelEnum = pgEnum("skill_level", [
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "ADVANCED",
]);
export const experienceLevelEnum = pgEnum("experience_level", [
  "STUDENT",
  "BEGINNER",
  "SOME_EXPERIENCE",
  "EXPERIENCED",
]);

export const exerciseTypeEnum = pgEnum("exercise_type", [
  "MULTIPLE_CHOICE",
  "PREDICT_OUTPUT",
  "FIX_BUG",
  "FILL_BLANK",
  "ARRANGE_LINES",
  "WRITE_CODE",
]);



// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    email: text("email").notNull().unique(),

    passwordHash: text("password_hash").notNull(),

    name: text("name").notNull(),

    role: roleEnum("role").default("STUDENT").notNull(),

    language: languageEnum("language"),

    currentLevel: skillLevelEnum("current_level")
      .default("BEGINNER")
      .notNull(),

    xp: integer("xp").default(0).notNull(),

    streakCount: integer("streak_count").default(0).notNull(),

    longestStreak: integer("longest_streak").default(0).notNull(),

    lastActiveDate: timestamp("last_active_date", {
      withTimezone: true,
    }),

    occupation: text("occupation"),

    experienceLevel: experienceLevelEnum("experience_level"),

    placementReadinessScore: integer("placement_readiness_score")
      .default(0)
      .notNull(),

    avatarUrl: text("avatar_url"),

    portfolioSlug: text("portfolio_slug").unique(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("users_language_current_level_idx").on(
      table.language,
      table.currentLevel,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────
// Syllabus Levels
// ─────────────────────────────────────────────

export const syllabusLevels = pgTable(
  "syllabus_levels",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    order: integer("order").notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    unique("syllabus_levels_order_unique").on(table.order),

    unique("syllabus_levels_title_unique").on(table.title),
  ],
);

// ─────────────────────────────────────────────
// Syllabus Topics
// ─────────────────────────────────────────────

export const syllabusTopics = pgTable(
  "syllabus_topics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    levelId: text("level_id").notNull(),

    order: integer("order").notNull(),

    title: text("title").notNull(),

    blurb: text("blurb").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.levelId],
      foreignColumns: [syllabusLevels.id],
      name: "syllabus_topics_level_id_fk",
    }),

    unique("syllabus_topics_level_order_unique").on(
      table.levelId,
      table.order,
    ),

    index("syllabus_topics_level_id_idx").on(table.levelId),
  ],
);

// ─────────────────────────────────────────────
// Syllabus Concepts
// ─────────────────────────────────────────────

export const syllabusConcepts = pgTable(
  "syllabus_concepts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    topicId: text("topic_id").notNull(),

    order: integer("order").notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    conceptSlug: text("concept_slug").notNull().unique(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.topicId],
      foreignColumns: [syllabusTopics.id],
      name: "syllabus_concepts_topic_id_fk",
    }),

    unique("syllabus_concepts_topic_order_unique").on(
      table.topicId,
      table.order,
    ),

    index("syllabus_concepts_topic_id_idx").on(table.topicId),
  ],
);



//   diagnostic Questions


export const diagnosticQuestions = pgTable("diagnostic_questions", {
  id: serial("id").primaryKey(),

  conceptSlug: varchar("concept_slug", { length: 100 }).notNull(),

  difficulty: varchar("difficulty", { length: 20 }).notNull(),

  prompt: text("prompt").notNull(),

  options: jsonb("options").$type<string[]>().notNull(),

  correctOptionIndex: integer("correct_option_index").notNull(),

  explanation: text("explanation").notNull(),
});

// ─────────────────────────────────────────────
// Diagnostic Attempts
// ─────────────────────────────────────────────

export const diagnosticAttempts = pgTable(
  "diagnostic_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id").notNull(),

    score: integer("score").notNull(),

    totalQuestions: integer("total_questions").notNull(),

    percentage: integer("percentage").notNull(),

    placementLevel: skillLevelEnum("placement_level").notNull(),

    startingSyllabusLevelId: text("starting_syllabus_level_id").notNull(),

    review: text("review").notNull(),

    breakdown: jsonb("breakdown")
      .$type<Record<string, { correct: number; total: number }>>()
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "diagnostic_attempts_user_id_fk",
    }),

    foreignKey({
      columns: [table.startingSyllabusLevelId],
      foreignColumns: [syllabusLevels.id],
      name: "diagnostic_attempts_starting_syllabus_level_id_fk",
    }),

    index("diagnostic_attempts_user_id_idx").on(table.userId),
  ],
);

export type DiagnosticAttempt = typeof diagnosticAttempts.$inferSelect;
export type NewDiagnosticAttempt = typeof diagnosticAttempts.$inferInsert;













// ─────────────────────────────────────────────
// Lessons
// ─────────────────────────────────────────────

export const lessons = pgTable(
  "lessons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    conceptId: text("concept_id").notNull(),

    order: integer("order").notNull(),

    title: text("title").notNull(),

    slug: text("slug").notNull(),

    xpReward: integer("xp_reward").default(10).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.conceptId],
      foreignColumns: [syllabusConcepts.id],
      name: "lessons_concept_id_fk",
    }),

    unique("lessons_slug_unique").on(table.slug),

    unique("lessons_concept_order_unique").on(table.conceptId, table.order),

    index("lessons_concept_id_idx").on(table.conceptId),
  ],
);

// ─────────────────────────────────────────────
// Exercises
// Answer-bearing fields stay server-only, with one exception: WRITE_CODE's
// starterCode, functionName, and tests are public because the browser runs
// the tests. Its explanation remains hidden until the exercise is checked.
// ─────────────────────────────────────────────

export type ExercisePayload = {
  options?: string[];
  correctIndex?: number;
  template?: string;
  bank?: string[];
  blanks?: Record<string, string[]>;
  lines?: Array<{ id: string; text: string }>;
  correctOrder?: string[];
  starterCode?: string;
  functionName?: string;
  tests?: Array<{ input: unknown[]; expected: unknown }>;
};

export const exercises = pgTable(
  "exercises",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    lessonId: text("lesson_id").notNull(),

    order: integer("order").notNull(),

    type: exerciseTypeEnum("type").notNull(),

    conceptSlug: varchar("concept_slug", { length: 100 }).notNull(),

    prompt: text("prompt").notNull(),

    code: text("code"),

    payload: jsonb("payload").$type<ExercisePayload>().notNull(),

    explanation: text("explanation").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: "exercises_lesson_id_fk",
    }),

    unique("exercises_lesson_order_unique").on(table.lessonId, table.order),

    index("exercises_lesson_id_idx").on(table.lessonId),
  ],
);

// ─────────────────────────────────────────────
// Lesson Sessions
// ─────────────────────────────────────────────

export const lessonSessions = pgTable(
  "lesson_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id").notNull(),

    lessonId: text("lesson_id").notNull(),

    xpAwarded: integer("xp_awarded").default(0).notNull(),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "lesson_sessions_user_id_fk",
    }),

    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: "lesson_sessions_lesson_id_fk",
    }),

    index("lesson_sessions_user_lesson_idx").on(table.userId, table.lessonId),
  ],
);

// ─────────────────────────────────────────────
// Exercise Attempts
// ─────────────────────────────────────────────

export const exerciseAttempts = pgTable(
  "exercise_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    sessionId: text("session_id").notNull(),

    exerciseId: text("exercise_id").notNull(),

    userId: text("user_id").notNull(),

    answer: jsonb("answer").$type<Record<string, unknown>>().notNull(),

    correct: boolean("correct").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [lessonSessions.id],
      name: "exercise_attempts_session_id_fk",
    }),

    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercises.id],
      name: "exercise_attempts_exercise_id_fk",
    }),

    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "exercise_attempts_user_id_fk",
    }),

    index("exercise_attempts_session_id_idx").on(table.sessionId),

    index("exercise_attempts_user_id_idx").on(table.userId),
  ],
);

// ─────────────────────────────────────────────
// User Lesson Progress
// ─────────────────────────────────────────────

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    userId: text("user_id").notNull(),

    lessonId: text("lesson_id").notNull(),

    status: text("status").default("LOCKED").notNull(),

    bestAccuracy: integer("best_accuracy").default(0).notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.lessonId],
      name: "user_lesson_progress_pk",
    }),

    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_lesson_progress_user_id_fk",
    }),

    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: "user_lesson_progress_lesson_id_fk",
    }),

    unique("user_lesson_progress_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
  ],
);

// ─────────────────────────────────────────────
// Lesson Completions
// One row per user/lesson: replaying never creates a second completion.
// ─────────────────────────────────────────────

export const lessonCompletions = pgTable(
  "lesson_completions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id").notNull(),

    lessonId: text("lesson_id").notNull(),

    sessionId: text("session_id").notNull().unique(),

    accuracyPercent: integer("accuracy_percent").notNull(),

    xpAwarded: integer("xp_awarded").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "lesson_completions_user_id_fk",
    }),

    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: "lesson_completions_lesson_id_fk",
    }),

    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [lessonSessions.id],
      name: "lesson_completions_session_id_fk",
    }),

    unique("lesson_completions_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
  ],
);

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type LessonCompletion = typeof lessonCompletions.$inferSelect;

// ─────────────────────────────────────────────
// Syllabus Types
// ─────────────────────────────────────────────

export type SyllabusLevel = typeof syllabusLevels.$inferSelect;
export type NewSyllabusLevel = typeof syllabusLevels.$inferInsert;

export type SyllabusTopic = typeof syllabusTopics.$inferSelect;
export type NewSyllabusTopic = typeof syllabusTopics.$inferInsert;

export type SyllabusConcept = typeof syllabusConcepts.$inferSelect;
export type NewSyllabusConcept = typeof syllabusConcepts.$inferInsert;