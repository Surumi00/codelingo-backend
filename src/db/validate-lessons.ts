import fs from "node:fs";
import path from "node:path";
import { db, pool } from "./index.js";
import { syllabusConcepts } from "./schema.js";

type ExerciseType =
  | "MULTIPLE_CHOICE"
  | "PREDICT_OUTPUT"
  | "FIX_BUG"
  | "FILL_BLANK"
  | "ARRANGE_LINES"
  | "WRITE_CODE";

type Payload = {
  options?: unknown;
  correctIndex?: unknown;
  template?: unknown;
  bank?: unknown;
  blanks?: unknown;
  lines?: unknown;
  correctOrder?: unknown;
  starterCode?: unknown;
  functionName?: unknown;
  tests?: unknown;
};

type LessonExercise = {
  type?: ExerciseType;
  prompt?: unknown;
  code?: unknown;
  payload?: Payload;
  explanation?: unknown;
};

type LessonFile = {
  slug?: unknown;
  title?: unknown;
  conceptSlug?: unknown;
  xpReward?: unknown;
  exercises?: unknown;
};

const lessonsDir = path.resolve(process.cwd(), "src/db/data/lessons");
const errors: string[] = [];
const expectedTypes: ExerciseType[] = [
  "MULTIPLE_CHOICE",
  "PREDICT_OUTPUT",
  "FIX_BUG",
  "FILL_BLANK",
  "ARRANGE_LINES",
  "WRITE_CODE",
];

function fail(file: string, message: string) {
  errors.push(`${file}: ${message}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function validateLesson(file: string, lesson: LessonFile) {
  if (!isNonEmptyString(lesson.slug)) fail(file, "slug is required");
  if (!isNonEmptyString(lesson.title)) fail(file, "title is required");
  if (!isNonEmptyString(lesson.conceptSlug)) fail(file, "conceptSlug is required");
  if (typeof lesson.xpReward !== "number") fail(file, "xpReward must be a number");
  if (
    isNonEmptyString(lesson.slug) &&
    isNonEmptyString(lesson.conceptSlug) &&
    lesson.slug !== lesson.conceptSlug
  ) {
    fail(file, "slug and conceptSlug must match");
  }

  if (!Array.isArray(lesson.exercises)) {
    fail(file, "exercises must be an array");
    return;
  }

  if (lesson.exercises.length !== 7) {
    fail(file, `expected 7 exercises, found ${lesson.exercises.length}`);
  }

  const typeCounts = new Map<ExerciseType, number>();
  const seenExercises = new Set<string>();

  lesson.exercises.forEach((rawExercise: LessonExercise, index) => {
    const label = `exercise ${index + 1}`;
    const type = rawExercise.type;

    if (!type || !expectedTypes.includes(type)) {
      fail(file, `${label}: invalid type ${String(type)}`);
      return;
    }

    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);

    if (!isNonEmptyString(rawExercise.prompt)) fail(file, `${label}: prompt is required`);
    if (!isNonEmptyString(rawExercise.explanation)) {
      fail(file, `${label}: explanation is required`);
    }

    const payload = rawExercise.payload;

    if (!payload || typeof payload !== "object") {
      fail(file, `${label}: payload is required`);
      return;
    }

    const signature = `${type}:${String(rawExercise.prompt)}`;

    if (seenExercises.has(signature)) {
      fail(file, `${label}: duplicate exercise`);
    }

    seenExercises.add(signature);

    if (["MULTIPLE_CHOICE", "PREDICT_OUTPUT", "FIX_BUG"].includes(type)) {
      if (!isStringArray(payload.options) || payload.options.length < 2) {
        fail(file, `${label}: options must be an array of strings`);
      } else if (
        typeof payload.correctIndex !== "number" ||
        !Number.isInteger(payload.correctIndex) ||
        payload.correctIndex < 0 ||
        payload.correctIndex >= payload.options.length
      ) {
        fail(file, `${label}: correctIndex must point at one of the options`);
      }

      if (type !== "MULTIPLE_CHOICE" && !isNonEmptyString(rawExercise.code)) {
        fail(file, `${label}: code is required`);
      }
    }

    if (type === "FILL_BLANK") {
      if (!isNonEmptyString(payload.template)) {
        fail(file, `${label}: template is required`);
        return;
      }

      if (!isStringArray(payload.bank)) {
        fail(file, `${label}: bank must be an array of strings`);
        return;
      }

      if (!payload.blanks || typeof payload.blanks !== "object") {
        fail(file, `${label}: blanks must be an object`);
        return;
      }

      const blanks = payload.blanks as Record<string, unknown>;
      const placeholders = [
        ...payload.template.matchAll(/\{\{(b\d+)\}\}/g),
      ].map((match) => match[1]);

      if (placeholders.length === 0) {
        fail(file, `${label}: template has no {{bN}} placeholder`);
      }

      for (const placeholder of placeholders) {
        const accepted = blanks[placeholder];

        if (!isStringArray(accepted) || accepted.length === 0) {
          fail(file, `${label}: blanks.${placeholder} must be a non-empty array`);
          continue;
        }

        for (const word of accepted) {
          if (!payload.bank.includes(word)) {
            fail(file, `${label}: accepted word "${word}" is missing from bank`);
          }
        }
      }
    }

    if (type === "ARRANGE_LINES") {
      if (!Array.isArray(payload.lines) || payload.lines.length < 2) {
        fail(file, `${label}: lines must contain at least two entries`);
        return;
      }

      const lines = payload.lines as Array<{ id?: unknown; text?: unknown }>;
      const ids = lines.map((line) => line.id);

      if (lines.some((line) => !isNonEmptyString(line.id) || !isNonEmptyString(line.text))) {
        fail(file, `${label}: every line needs an id and text`);
      }

      if (new Set(ids).size !== ids.length) {
        fail(file, `${label}: line ids must be unique`);
      }

      if (!isStringArray(payload.correctOrder)) {
        fail(file, `${label}: correctOrder must be an array of strings`);
        return;
      }

      const order = payload.correctOrder;

      if (order.length !== ids.length) {
        fail(file, `${label}: correctOrder must contain every line id exactly once`);
      }

      if (
        new Set(order).size !== order.length ||
        order.some((id) => !ids.includes(id))
      ) {
        fail(file, `${label}: correctOrder contains an unknown or duplicate id`);
      }
    }

    if (type === "WRITE_CODE") {
      if (!isNonEmptyString(payload.starterCode)) {
        fail(file, `${label}: starterCode is required`);
      }

      if (!isNonEmptyString(payload.functionName)) {
        fail(file, `${label}: functionName is required`);
      } else if (
        isNonEmptyString(payload.starterCode) &&
        !payload.starterCode.includes(`def ${payload.functionName}`)
      ) {
        fail(
          file,
          `${label}: starterCode must contain "def ${payload.functionName}"`,
        );
      }

      if (!Array.isArray(payload.tests) || payload.tests.length < 2) {
        fail(file, `${label}: tests must contain at least two entries`);
        return;
      }

      payload.tests.forEach((test, testIndex) => {
        if (!test || typeof test !== "object" || Array.isArray(test)) {
          fail(file, `${label}: test ${testIndex + 1} must be an object`);
          return;
        }

        const testRecord = test as Record<string, unknown>;

        if (!Array.isArray(testRecord.input)) {
          fail(file, `${label}: test ${testIndex + 1}.input must be an array`);
        }

        if (!Object.prototype.hasOwnProperty.call(testRecord, "expected")) {
          fail(file, `${label}: test ${testIndex + 1}.expected is required`);
        }
      });
    }
  });

  for (const type of expectedTypes) {
    const expected = type === "MULTIPLE_CHOICE" ? 2 : 1;
    const actual = typeCounts.get(type) ?? 0;

    if (actual !== expected) {
      fail(file, `expected ${expected} ${type} exercise(s), found ${actual}`);
    }
  }
}

async function validateConceptCoverage(slugs: string[]) {
  const concepts = await db
    .select({ conceptSlug: syllabusConcepts.conceptSlug })
    .from(syllabusConcepts);

  if (concepts.length !== slugs.length) {
    errors.push(
      `database has ${concepts.length} concepts but ${slugs.length} lesson files exist`,
    );
  }

  const files = new Set(slugs);
  const missing = concepts
    .map((concept) => concept.conceptSlug)
    .filter((slug) => !files.has(slug));

  if (missing.length > 0) {
    errors.push(`missing lessons for concepts: ${missing.join(", ")}`);
  }
}

async function validateLessons() {
  const files = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const slugs: string[] = [];

  for (const file of files) {
    const lesson = JSON.parse(
      fs.readFileSync(path.join(lessonsDir, file), "utf8"),
    ) as LessonFile;

    if (isNonEmptyString(lesson.slug)) {
      if (slugs.includes(lesson.slug)) {
        fail(file, `duplicate slug "${lesson.slug}"`);
      }

      slugs.push(lesson.slug);
    }

    validateLesson(file, lesson);
  }

  await validateConceptCoverage(slugs);

  if (errors.length > 0) {
    console.error(`❌ Lesson validation failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ Validated ${files.length} lessons and ${files.length * 7} exercises.`,
  );
}

validateLessons()
  .catch((error) => {
    console.error("❌ Failed to validate lessons:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
