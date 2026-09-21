import { createId } from "@paralleldrive/cuid2";
import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
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

    lastActiveDate: timestamp("last_active_date", {
      withTimezone: true,
    }),

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

// ─────────────────────────────────────────────
// Syllabus Types
// ─────────────────────────────────────────────

export type SyllabusLevel = typeof syllabusLevels.$inferSelect;
export type NewSyllabusLevel = typeof syllabusLevels.$inferInsert;

export type SyllabusTopic = typeof syllabusTopics.$inferSelect;
export type NewSyllabusTopic = typeof syllabusTopics.$inferInsert;

export type SyllabusConcept = typeof syllabusConcepts.$inferSelect;
export type NewSyllabusConcept = typeof syllabusConcepts.$inferInsert;