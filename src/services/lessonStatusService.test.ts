import { describe, it, expect } from "vitest";
import type { OrderedLesson } from "./lessonStatusService.js";
import { computeLessonStatuses } from "./lessonStatusService.js";

function makeOrderedLesson(id: string, conceptId: string, conceptSlug: string, title: string, order: number, xpReward: number): OrderedLesson {
  return { id, conceptId, conceptSlug, title, order, xpReward };
}

describe("computeLessonStatuses", () => {
  // new user - no lessons completed, only first lesson available
  it("new user: only the first lesson is AVAILABLE, rest are LOCKED", () => {
    const orderedLessons = [
      makeOrderedLesson("lesson-1", "concept-1", "concept-slug-1", "Lesson 1", 1, 10),
      makeOrderedLesson("lesson-2", "concept-1", "concept-slug-1", "Lesson 2", 2, 10),
      makeOrderedLesson("lesson-3", "concept-1", "concept-slug-1", "Lesson 3", 3, 10),
    ];
    const completedLessonIds = new Set<string>();

    const result = computeLessonStatuses(orderedLessons, completedLessonIds);

    expect(result[0].status).toBe("AVAILABLE");
    expect(result[1].status).toBe("LOCKED");
    expect(result[2].status).toBe("LOCKED");
  });

  // after completing lesson 1 - lesson 2 becomes available
  it("after completing lesson 1: lesson 1 COMPLETED, lesson 2 AVAILABLE, lesson 3 LOCKED", () => {
    const orderedLessons = [
      makeOrderedLesson("lesson-1", "concept-1", "concept-slug-1", "Lesson 1", 1, 10),
      makeOrderedLesson("lesson-2", "concept-1", "concept-slug-1", "Lesson 2", 2, 10),
      makeOrderedLesson("lesson-3", "concept-1", "concept-slug-1", "Lesson 3", 3, 10),
    ];
    const completedLessonIds = new Set(["lesson-1"]);

    const result = computeLessonStatuses(orderedLessons, completedLessonIds);

    expect(result[0].status).toBe("COMPLETED");
    expect(result[1].status).toBe("AVAILABLE");
    expect(result[2].status).toBe("LOCKED");
  });

  // all completed
  it("all completed: all lessons have COMPLETED status", () => {
    const orderedLessons = [
      makeOrderedLesson("lesson-1", "concept-1", "concept-slug-1", "Lesson 1", 1, 10),
      makeOrderedLesson("lesson-2", "concept-1", "concept-slug-1", "Lesson 2", 2, 10),
      makeOrderedLesson("lesson-3", "concept-1", "concept-slug-1", "Lesson 3", 3, 10),
    ];
    const completedLessonIds = new Set(["lesson-1", "lesson-2", "lesson-3"]);

    const result = computeLessonStatuses(orderedLessons, completedLessonIds);

    expect(result[0].status).toBe("COMPLETED");
    expect(result[1].status).toBe("COMPLETED");
    expect(result[2].status).toBe("COMPLETED");
  });
});