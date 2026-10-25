import type { Response } from "express";
import { db } from "../db/index.js";
import {
  syllabusConcepts,
  syllabusLevels,
  syllabusTopics,
} from "../db/schema.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { computeLessonStatuses } from "../services/lessonStatusService.js";
import {
  getCompletedLessonIds,
  getOrderedLessons,
} from "../services/progressionService.js";

interface LessonDto {
  id: string;
  title: string;
  order: number;
  xpReward: number;
  status: "LOCKED" | "AVAILABLE" | "COMPLETED";
}

interface ConceptDto {
  id: string;
  title: string;
  description: string;
  conceptSlug: string;
  lessons: LessonDto[];
}

interface TopicDto {
  id: string;
  title: string;
  blurb: string;
  concepts: ConceptDto[];
}

interface LevelDto {
  id: string;
  title: string;
  description: string;
  topics: TopicDto[];
}

// GET /api/syllabus
export async function getSyllabus(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const levels = await db
      .select({
        id: syllabusLevels.id,
        title: syllabusLevels.title,
        description: syllabusLevels.description,
        order: syllabusLevels.order,
      })
      .from(syllabusLevels)
      .orderBy(syllabusLevels.order);

    const topics = await db
      .select({
        id: syllabusTopics.id,
        levelId: syllabusTopics.levelId,
        title: syllabusTopics.title,
        blurb: syllabusTopics.blurb,
        order: syllabusTopics.order,
      })
      .from(syllabusTopics)
      .orderBy(syllabusTopics.levelId, syllabusTopics.order);

    const concepts = await db
      .select({
        id: syllabusConcepts.id,
        topicId: syllabusConcepts.topicId,
        title: syllabusConcepts.title,
        description: syllabusConcepts.description,
        conceptSlug: syllabusConcepts.conceptSlug,
        order: syllabusConcepts.order,
      })
      .from(syllabusConcepts)
      .orderBy(syllabusConcepts.topicId, syllabusConcepts.order);

    const orderedLessons = await getOrderedLessons();
    const completedLessonIds = await getCompletedLessonIds(req.userId);

    const lessonsByConcept = new Map<string, LessonDto[]>();

    for (const lesson of computeLessonStatuses(orderedLessons, completedLessonIds)) {
      const list = lessonsByConcept.get(lesson.conceptId) ?? [];

      list.push({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        xpReward: lesson.xpReward,
        status: lesson.status,
      });

      lessonsByConcept.set(lesson.conceptId, list);
    }

    const conceptsByTopic = new Map<string, ConceptDto[]>();

    for (const concept of concepts) {
      const list = conceptsByTopic.get(concept.topicId) ?? [];

      list.push({
        id: concept.id,
        title: concept.title,
        description: concept.description,
        conceptSlug: concept.conceptSlug,
        lessons: lessonsByConcept.get(concept.id) ?? [],
      });

      conceptsByTopic.set(concept.topicId, list);
    }

    const topicsByLevel = new Map<string, TopicDto[]>();

    for (const topic of topics) {
      const list = topicsByLevel.get(topic.levelId) ?? [];

      list.push({
        id: topic.id,
        title: topic.title,
        blurb: topic.blurb,
        concepts: conceptsByTopic.get(topic.id) ?? [],
      });

      topicsByLevel.set(topic.levelId, list);
    }

    const data: LevelDto[] = levels.map((level) => ({
      id: level.id,
      title: level.title,
      description: level.description,
      topics: topicsByLevel.get(level.id) ?? [],
    }));

    res.json({ data });
  } catch (error) {
    console.error("Error fetching syllabus:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}