CREATE TABLE "user_lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text DEFAULT 'LOCKED' NOT NULL,
	"best_accuracy" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "user_lesson_progress_pk" PRIMARY KEY("user_id","lesson_id"),
	CONSTRAINT "user_lesson_progress_user_lesson_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "exercise_attempts" RENAME COLUMN "is_correct" TO "correct";--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD COLUMN "started_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "lessons" AS l
SET "slug" = sc."concept_slug" || CASE WHEN l."order" = 1 THEN '' ELSE '-' || l."order" END
FROM "syllabus_concepts" AS sc
WHERE l."concept_id" = sc."id";--> statement-breakpoint
UPDATE "lessons" SET "slug" = 'legacy-' || "id" WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_attempts_user_id_idx" ON "exercise_attempts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_slug_unique" UNIQUE("slug");