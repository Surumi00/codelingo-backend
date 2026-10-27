import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  lessonCompletions,
  lessons,
  syllabusConcepts,
  syllabusLevels,
  syllabusTopics,
} from "../db/schema.js";
import {
  computeLessonStatuses,
  type LessonWithStatus,
  type OrderedLesson,
} from "./lessonStatusService.js";

export type {
  LessonStatus,
  LessonWithStatus,
  OrderedLesson,
} from "./lessonStatusService.js";

// Lessons in the global learning order: level order, topic order, concept
// order, then lesson order.
export async function getOrderedLessons(): Promise<OrderedLesson[]> {
  return db
    .select({
      id: lessons.id,
      conceptId: lessons.conceptId,
      conceptSlug: syllabusConcepts.conceptSlug,
      title: lessons.title,
      order: lessons.order,
      xpReward: lessons.xpReward,
      levelId: syllabusLevels.id,
    })
    .from(lessons)
    .innerJoin(syllabusConcepts, eq(lessons.conceptId, syllabusConcepts.id))
    .innerJoin(syllabusTopics, eq(syllabusConcepts.topicId, syllabusTopics.id))
    .innerJoin(syllabusLevels, eq(syllabusTopics.levelId, syllabusLevels.id))
    .orderBy(
      asc(syllabusLevels.order),
      asc(syllabusTopics.order),
      asc(syllabusConcepts.order),
      asc(lessons.order),
    );
}

export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ lessonId: lessonCompletions.lessonId })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, userId));

  return new Set(rows.map((row) => row.lessonId));
}

export async function getLessonWithStatus(
  userId: string,
  lessonId: string,
): Promise<LessonWithStatus | null> {
  const orderedLessons = await getOrderedLessons();
  const completedLessonIds = await getCompletedLessonIds(userId);
  const withStatus = computeLessonStatuses(orderedLessons, completedLessonIds);

  return withStatus.find((lesson) => lesson.id === lessonId) ?? null;
}
