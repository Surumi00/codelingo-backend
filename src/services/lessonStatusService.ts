export type LessonStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export type OrderedLesson = {
  id: string;
  conceptId: string;
  conceptSlug: string;
  title: string;
  order: number;
  xpReward: number;
};

export type LessonWithStatus = OrderedLesson & { status: LessonStatus };

// A lesson is COMPLETED when the user finished it, AVAILABLE when it is the
// first lesson or the lesson before it is completed, LOCKED otherwise.
export function computeLessonStatuses(
  orderedLessons: OrderedLesson[],
  completedLessonIds: Set<string>,
): LessonWithStatus[] {
  let previousCompleted = true;

  return orderedLessons.map((lesson) => {
    const isCompleted = completedLessonIds.has(lesson.id);
    const status: LessonStatus = isCompleted
      ? "COMPLETED"
      : previousCompleted
        ? "AVAILABLE"
        : "LOCKED";

    previousCompleted = isCompleted;

    return { ...lesson, status };
  });
}
