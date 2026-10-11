CREATE TABLE "diagnostic_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"percentage" integer NOT NULL,
	"placement_level" "skill_level" NOT NULL,
	"starting_syllabus_level_id" text NOT NULL,
	"review" text NOT NULL,
	"breakdown" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_starting_syllabus_level_id_fk" FOREIGN KEY ("starting_syllabus_level_id") REFERENCES "public"."syllabus_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnostic_attempts_user_id_idx" ON "diagnostic_attempts" USING btree ("user_id");