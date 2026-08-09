CREATE TYPE "public"."language" AS ENUM('PYTHON', 'JAVA', 'JAVASCRIPT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'STUDENT' NOT NULL,
	"language" "language",
	"current_level" "skill_level" DEFAULT 'BEGINNER' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"last_active_date" timestamp with time zone,
	"placement_readiness_score" integer DEFAULT 0 NOT NULL,
	"avatar_url" text,
	"portfolio_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_portfolio_slug_unique" UNIQUE("portfolio_slug")
);
--> statement-breakpoint
CREATE INDEX "users_language_current_level_idx" ON "users" USING btree ("language","current_level");