CREATE TYPE "public"."exercise_type" AS ENUM('MULTIPLE_CHOICE', 'PREDICT_OUTPUT', 'FIX_BUG', 'FILL_BLANK', 'ARRANGE_LINES');--> statement-breakpoint
CREATE TABLE "exercise_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"order" integer NOT NULL,
	"type" "exercise_type" NOT NULL,
	"concept_slug" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"code" text,
	"payload" jsonb NOT NULL,
	"explanation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_lesson_order_unique" UNIQUE("lesson_id","order")
);
--> statement-breakpoint
CREATE TABLE "lesson_completions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"session_id" text NOT NULL,
	"accuracy_percent" integer NOT NULL,
	"xp_awarded" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_completions_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "lesson_completions_user_lesson_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"concept_id" text NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"xp_reward" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_concept_order_unique" UNIQUE("concept_id","order")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "longest_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."lesson_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."lesson_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_concept_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."syllabus_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_attempts_session_id_idx" ON "exercise_attempts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "exercises_lesson_id_idx" ON "exercises" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_sessions_user_lesson_idx" ON "lesson_sessions" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lessons_concept_id_idx" ON "lessons" USING btree ("concept_id");