import fs from "node:fs";
import path from "node:path";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "./index.js";
import {
  exercises,
  lessons,
  syllabusConcepts,
  type ExercisePayload,
  type NewExercise,
} from "./schema.js";

type SeedExercise = {
  type: NewExercise["type"];
  prompt: string;
  code?: string;
  payload: ExercisePayload;
  explanation: string;
};

type SeedLesson = {
  slug: string;
  title: string;
  conceptSlug: string;
  xpReward: number;
  exercises: SeedExercise[];
};

const lessonsDir = path.resolve(process.cwd(), "src/db/data/lessons");

function loadLessonFiles(): SeedLesson[] {
  return fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(lessonsDir, file), "utf8");

      return JSON.parse(raw) as SeedLesson;
    });
}

async function seedLessons() {
  const lessonFiles = loadLessonFiles();

  for (const lessonData of lessonFiles) {
    const [concept] = await db
      .select({ id: syllabusConcepts.id })
      .from(syllabusConcepts)
      .where(eq(syllabusConcepts.conceptSlug, lessonData.conceptSlug))
      .limit(1);

    if (!concept) {
      throw new Error(
        `Concept "${lessonData.conceptSlug}" is not seeded. Run db:seed:syllabus first.`,
      );
    }

    await db.transaction(async (tx) => {
      const [lesson] = await tx
        .insert(lessons)
        .values({
          conceptId: concept.id,
          order: 1,
          title: lessonData.title,
          slug: lessonData.slug,
          xpReward: lessonData.xpReward,
        })
        .onConflictDoUpdate({
          target: lessons.slug,
          set: {
            conceptId: concept.id,
            order: 1,
            title: lessonData.title,
            xpReward: lessonData.xpReward,
            updatedAt: new Date(),
          },
        })
        .returning({ id: lessons.id });

      // Upsert by lesson/order so existing exercise ids survive re-seeding
      // even when learners already have attempts against them.
      await tx
        .insert(exercises)
        .values(
          lessonData.exercises.map((exercise, index) => ({
            lessonId: lesson.id,
            order: index + 1,
            type: exercise.type,
            conceptSlug: lessonData.conceptSlug,
            prompt: exercise.prompt,
            code: exercise.code ?? null,
            payload: exercise.payload,
            explanation: exercise.explanation,
          })),
        )
        .onConflictDoUpdate({
          target: [exercises.lessonId, exercises.order],
          set: {
            type: sql`excluded.type`,
            conceptSlug: sql`excluded.concept_slug`,
            prompt: sql`excluded.prompt`,
            code: sql`excluded.code`,
            payload: sql`excluded.payload`,
            explanation: sql`excluded.explanation`,
            updatedAt: new Date(),
          },
        });

      await tx.delete(exercises).where(
        and(
          eq(exercises.lessonId, lesson.id),
          notInArray(
            exercises.order,
            lessonData.exercises.map((_, index) => index + 1),
          ),
        ),
      );

      console.log(`  ✓ ${lessonData.slug} (${lessonData.exercises.length} exercises)`);
    });
  }

  console.log(`✅ Seeded ${lessonFiles.length} lessons.`);
}

seedLessons()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to seed lessons:");
    console.error(error);
    process.exit(1);
  });
