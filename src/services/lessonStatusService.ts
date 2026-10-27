export type LessonStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export type OrderedLesson = {
  id: string;
  conceptId: string;
  conceptSlug: string;
  title: string;
  order: number;
  xpReward: number;
  levelId: string;
};

export type LessonWithStatus = OrderedLesson & { status: LessonStatus };

// A lesson is COMPLETED when the user finished it, AVAILABLE when it is the
// first lesson of a level (each level's entry point is always open) or the
// lesson before it is completed, LOCKED otherwise. Lessons are expected in
// global order (level order first), so a level change is a levelId change.
export function computeLessonStatuses(
  orderedLessons: OrderedLesson[],
  completedLessonIds: Set<string>,
): LessonWithStatus[] {
  let previousCompleted = true;
  let previousLevelId: string | null = null;

  return orderedLessons.map((lesson) => {
    const isCompleted = completedLessonIds.has(lesson.id);
    const isFirstLessonOfLevel = previousLevelId !== lesson.levelId;
    const status: LessonStatus = isCompleted
      ? "COMPLETED"
      : previousCompleted || isFirstLessonOfLevel
        ? "AVAILABLE"
        : "LOCKED";

    previousCompleted = isCompleted;
    previousLevelId = lesson.levelId;

    return { ...lesson, status };
  });
}
