import { createId } from "@paralleldrive/cuid2";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["STUDENT", "ADMIN"]);
export const languageEnum = pgEnum("language", ["PYTHON", "JAVA", "JAVASCRIPT"]);
export const skillLevelEnum = pgEnum("skill_level", [
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "ADVANCED",
]);

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
    currentLevel: skillLevelEnum("current_level").default("BEGINNER").notNull(),
    xp: integer("xp").default(0).notNull(),
    streakCount: integer("streak_count").default(0).notNull(),
    lastActiveDate: timestamp("last_active_date", { withTimezone: true }),
    placementReadinessScore: integer("placement_readiness_score")
      .default(0)
      .notNull(),
    avatarUrl: text("avatar_url"),
    portfolioSlug: text("portfolio_slug").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
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
