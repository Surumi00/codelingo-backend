CREATE TYPE "public"."experience_level" AS ENUM('STUDENT', 'BEGINNER', 'SOME_EXPERIENCE', 'EXPERIENCED');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience_level" "experience_level";