import type { Exercise, ExercisePayload } from "../db/schema.js";

export type Answer = Record<string, unknown>;

export type GradeOutcome =
  | {
      ok: true;
      answer: Answer;
      correctAnswer?: Answer;
      isCorrect: boolean;
    }
  | { ok: false; message: string };

const CHOICE_TYPES = new Set(["MULTIPLE_CHOICE", "PREDICT_OUTPUT", "FIX_BUG"]);

function trimText(value: string): string {
  return value.trim();
}

// Grades a submitted answer against an exercise payload. Pure: callers pass
// the exercise row and the raw request body, and get back the normalized
// answer plus the verdict.
export function gradeAnswer(
  exercise: Pick<Exercise, "type" | "payload">,
  raw: unknown,
): GradeOutcome {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "answer object is required" };
  }

  const answer = raw as Answer;
  const payload = exercise.payload ?? {};

  if (CHOICE_TYPES.has(exercise.type)) {
    const options = payload.options ?? [];
    const selectedIndex = answer.selectedIndex;

    if (
      !Number.isInteger(selectedIndex) ||
      (selectedIndex as number) < 0 ||
      (selectedIndex as number) >= options.length
    ) {
      return {
        ok: false,
        message: "answer.selectedIndex must point at one of the options",
      };
    }

    const correctIndex = payload.correctIndex ?? -1;

    return {
      ok: true,
      answer: { selectedIndex },
      correctAnswer: { selectedIndex: correctIndex },
      isCorrect: selectedIndex === correctIndex,
    };
  }

  if (exercise.type === "FILL_BLANK") {
    const blanks = payload.blanks ?? {};
    const submitted = answer.blanks;

    if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) {
      return { ok: false, message: "answer.blanks must be an object" };
    }

    const submittedBlanks = submitted as Answer;
    const normalizedBlanks: Record<string, string> = {};
    const correctBlanks: Record<string, string> = {};

    for (const [key, accepted] of Object.entries(blanks)) {
      const value = submittedBlanks[key];

      if (typeof value !== "string") {
        return { ok: false, message: `answer.blanks.${key} is required` };
      }

      normalizedBlanks[key] = trimText(value);
      correctBlanks[key] = accepted[0] ?? "";
    }

    const isCorrect = Object.entries(blanks).every(([key, accepted]) =>
      accepted.map((entry: string) => trimText(entry)).includes(
        normalizedBlanks[key] ?? "",
      ),
    );

    return {
      ok: true,
      answer: { blanks: normalizedBlanks },
      correctAnswer: { blanks: correctBlanks },
      isCorrect,
    };
  }

  if (exercise.type === "WRITE_CODE") {
    // WRITE_CODE grading is client-trusted for now. Move this to a
    // server-side runner before using it for high-stakes assessment.
    const code = answer.code;
    const passed = answer.passed;

    if (typeof code !== "string" || code.length > 5000) {
      return {
        ok: false,
        message: "answer.code must be a string of at most 5000 characters",
      };
    }

    if (typeof passed !== "boolean") {
      return { ok: false, message: "answer.passed must be a boolean" };
    }

    return {
      ok: true,
      answer: { code, passed },
      isCorrect: passed,
    };
  }

  if (exercise.type === "ARRANGE_LINES") {
    const lines = payload.lines ?? [];
    const order = answer.order;

    if (
      !Array.isArray(order) ||
      order.length !== lines.length ||
      order.some((entry) => typeof entry !== "string")
    ) {
      return { ok: false, message: "answer.order must list every line id" };
    }

    const lineIds = lines.map((line) => line.id);

    if (
      new Set(order).size !== order.length ||
      order.some((entry) => !lineIds.includes(entry as string))
    ) {
      return {
        ok: false,
        message: "answer.order must contain each line id exactly once",
      };
    }

    const correctOrder = payload.correctOrder ?? [];

    return {
      ok: true,
      answer: { order },
      correctAnswer: { order: correctOrder },
      isCorrect: JSON.stringify(order) === JSON.stringify(correctOrder),
    };
  }

  return { ok: false, message: "Unsupported exercise type" };
}

// Ratio of exercises answered correctly on the first attempt, between 0 and 1.
export function computeAccuracy(
  lessonExercises: Array<Pick<Exercise, "id">>,
  attempts: Array<{ exerciseId: string; correct: boolean }>,
): number {
  if (lessonExercises.length === 0) {
    return 0;
  }

  const firstAttemptByExercise = new Map<string, boolean>();

  for (const attempt of attempts) {
    if (!firstAttemptByExercise.has(attempt.exerciseId)) {
      firstAttemptByExercise.set(attempt.exerciseId, attempt.correct);
    }
  }

  const firstTryCorrect = lessonExercises.filter(
    (exercise) => firstAttemptByExercise.get(exercise.id) === true,
  ).length;

  return firstTryCorrect / lessonExercises.length;
}

// First completion pays the lesson reward plus a bonus for a perfect first
// run; replaying an already completed lesson pays a small flat amount.
export function computeXp(
  xpReward: number,
  accuracy: number,
  isReplay: boolean,
): number {
  if (isReplay) {
    return 2;
  }

  return xpReward + (accuracy === 1 ? 5 : 0);
}

export type ClientExerciseSource = {
  id: string;
  order: number;
  type: Exercise["type"];
  prompt: string;
  code: string | null;
  payload: ExercisePayload;
};

export type ClientExercise = {
  id: string;
  order: number;
  type: Exercise["type"];
  prompt: string;
  code: string | null;
  options?: string[];
  template?: string;
  bank?: string[];
  starterCode?: string;
  functionName?: string;
  tests?: Array<{ input: unknown[]; expected: unknown }>;
  lines?: Array<{ id: string; text: string }>;
};

function shuffleLines(
  lines: Array<{ id: string; text: string }>,
  correctOrder: string[],
): Array<{ id: string; text: string }> {
  const shuffled = [...lines];

  if (shuffled.length < 2) {
    return shuffled;
  }

  // Never hand the browser an already-correct order.
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const matchesKey =
      shuffled.map((line) => line.id).join(",") === correctOrder.join(",");

    if (!matchesKey) {
      break;
    }
  }

  return shuffled;
}

// Most payloads carry an answer key, so only the browser-safe fields are
// copied. WRITE_CODE is the exception: starterCode, functionName, and tests
// are all public because the browser runs the tests. Its explanation stays
// hidden until the exercise is checked.
export function toClientExercise(
  exercise: ClientExerciseSource,
): ClientExercise {
  const payload = exercise.payload ?? {};
  const base = {
    id: exercise.id,
    order: exercise.order,
    type: exercise.type,
    prompt: exercise.prompt,
    code: exercise.code,
  };

  if (CHOICE_TYPES.has(exercise.type)) {
    return { ...base, options: payload.options ?? [] };
  }

  if (exercise.type === "FILL_BLANK") {
    return {
      ...base,
      template: payload.template ?? "",
      bank: payload.bank ?? [],
    };
  }

  if (exercise.type === "WRITE_CODE") {
    return {
      ...base,
      starterCode: payload.starterCode ?? "",
      functionName: payload.functionName ?? "",
      tests: payload.tests ?? [],
    };
  }

  return {
    ...base,
    lines: shuffleLines(payload.lines ?? [], payload.correctOrder ?? []),
  };
}

export type ClientLesson = {
  id: string;
  title: string;
  xpReward: number;
  exercises: ClientExercise[];
};

// The GET /lessons/:id body: lesson metadata plus sanitized exercises.
export function toClientLesson(
  lesson: { id: string; title: string; xpReward: number },
  lessonExercises: ClientExerciseSource[],
): ClientLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    xpReward: lesson.xpReward,
    exercises: lessonExercises.map(toClientExercise),
  };
}
