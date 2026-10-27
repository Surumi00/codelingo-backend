import { describe, it, expect } from "vitest";
import type { OrderedLesson } from "./lessonStatusService.js";
import { computeLessonStatuses } from "./lessonStatusService.js";

function makeOrderedLesson(id: string, conceptId: string, conceptSlug: string, title: string, order: number, xpReward: number, levelId = "level-1"): OrderedLesson {
  return { id, conceptId, conceptSlug, title, order, xpReward, levelId };
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

  // the first lesson of every level is an entry point and stays open even
  // when earlier levels are unfinished
  it("first lesson of each level is AVAILABLE even with nothing completed", () => {
    const orderedLessons = [
      makeOrderedLesson("lesson-1", "concept-1", "concept-slug-1", "Lesson 1", 1, 10, "level-beginner"),
      makeOrderedLesson("lesson-2", "concept-1", "concept-slug-1", "Lesson 2", 2, 10, "level-beginner"),
      makeOrderedLesson("lesson-3", "concept-2", "concept-slug-2", "Lesson 3", 1, 10, "level-intermediate"),
      makeOrderedLesson("lesson-4", "concept-2", "concept-slug-2", "Lesson 4", 2, 10, "level-intermediate"),
      makeOrderedLesson("lesson-5", "concept-3", "concept-slug-3", "Lesson 5", 1, 10, "level-advanced"),
    ];
    const completedLessonIds = new Set<string>();

    const result = computeLessonStatuses(orderedLessons, completedLessonIds);

    expect(result[0].status).toBe("AVAILABLE");
    expect(result[1].status).toBe("LOCKED");
    expect(result[2].status).toBe("AVAILABLE");
    expect(result[3].status).toBe("LOCKED");
    expect(result[4].status).toBe("AVAILABLE");
  });

  // completing a level's entry point unlocks the next lesson of that level
  it("completing a level's first lesson unlocks the next lesson in the same level", () => {
    const orderedLessons = [
      makeOrderedLesson("lesson-1", "concept-1", "concept-slug-1", "Lesson 1", 1, 10, "level-beginner"),
      makeOrderedLesson("lesson-2", "concept-1", "concept-slug-1", "Lesson 2", 2, 10, "level-beginner"),
      makeOrderedLesson("lesson-3", "concept-2", "concept-slug-2", "Lesson 3", 1, 10, "level-intermediate"),
      makeOrderedLesson("lesson-4", "concept-2", "concept-slug-2", "Lesson 4", 2, 10, "level-intermediate"),
    ];
    const completedLessonIds = new Set(["lesson-3"]);

    const result = computeLessonStatuses(orderedLessons, completedLessonIds);

    expect(result[0].status).toBe("AVAILABLE");
    expect(result[1].status).toBe("LOCKED");
    expect(result[2].status).toBe("COMPLETED");
    expect(result[3].status).toBe("AVAILABLE");
  });
});