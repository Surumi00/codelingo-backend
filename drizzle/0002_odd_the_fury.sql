CREATE TABLE "diagnostic_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"concept_slug" varchar(100) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option_index" integer NOT NULL,
	"explanation" text NOT NULL
);
