CREATE TABLE "syllabus_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"concept_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "syllabus_concepts_concept_slug_unique" UNIQUE("concept_slug"),
	CONSTRAINT "syllabus_concepts_topic_order_unique" UNIQUE("topic_id","order")
);
--> statement-breakpoint
CREATE TABLE "syllabus_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "syllabus_levels_order_unique" UNIQUE("order"),
	CONSTRAINT "syllabus_levels_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "syllabus_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"level_id" text NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"blurb" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "syllabus_topics_level_order_unique" UNIQUE("level_id","order")
);
--> statement-breakpoint
ALTER TABLE "syllabus_concepts" ADD CONSTRAINT "syllabus_concepts_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."syllabus_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "syllabus_topics" ADD CONSTRAINT "syllabus_topics_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."syllabus_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "syllabus_concepts_topic_id_idx" ON "syllabus_concepts" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "syllabus_topics_level_id_idx" ON "syllabus_topics" USING btree ("level_id");