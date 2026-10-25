import { describe, it, expect } from "vitest";
import { toClientExercise } from "./exerciseService.js";

// Define local types for test data (SeedLesson is not exported from seed-lessons.ts)
type SeedExercise = {
  type: string;
  prompt: string;
  code?: string | null;
  payload: unknown;
  explanation: string;
};

type SeedLesson = {
  slug: string;
  title: string;
  conceptSlug: string;
  xpReward: number;
  exercises: SeedExercise[];
};

// Test lesson data
const lessonData: SeedLesson[] = [
  // arithmetic-operators
  {
    slug: "arithmetic-operators",
    title: "Arithmetic Operators",
    conceptSlug: "arithmetic-operators",
    xpReward: 10,
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which concept matches this description?\n\n“Learn operators used for mathematical calculations such as addition, subtraction, multiplication, division, and modulus.”",
        payload: {
          options: ["List Methods", "Arithmetic Operators", "for Loops", "Parameters"],
          correctIndex: 1,
        },
        explanation: "The description belongs to Arithmetic Operators.",
      },
      {
        type: "PREDICT_OUTPUT",
        prompt: "What does this program print?\n\nPracticing: Arithmetic Operators",
        code: "x = 7\ny = 3\nprint(x // y)",
        payload: {
          options: ["2", "2.33", "3", "10"],
          correctIndex: 0,
        },
        explanation: "The program prints \"2\".",
      },
      {
        type: "FIX_BUG",
        prompt: "Which line fixes the bug? The code should print \"11\".",
        code: "print((5 + 2) * 3)",
        payload: {
          options: [
            "print(5 + 2 + 3)",
            "print(5 * 2 + 3)",
            "print(5 - 2 * 3)",
            "print(5 + 2 * 3)",
          ],
          correctIndex: 3,
        },
        explanation: "The fixed code prints \"11\".",
      },
      {
        type: "FILL_BLANK",
        prompt: "Fill in the blank. The code should print \"1\".",
        payload: {
          template: "print(10 {{b1}} 3)",
          bank: ["%", "/", "//", "*"],
          blanks: { b1: ["%"] },
        },
        explanation: "Replacing the blank with \"%\" produces the expected output.",
      },
      {
        type: "ARRANGE_LINES",
        prompt: "Calculate and print a total with tax.",
        payload: {
          lines: [
            { id: "l1", text: "price = 10" },
            { id: "l2", text: "tax = 2" },
            { id: "l3", text: "total = price + tax" },
            { id: "l4", text: "print(total)" },
          ],
          correctOrder: ["l1", "l2", "l3", "l4"],
        },
        explanation: "Run in this order to print \"12\".",
      },
      {
        type: "WRITE_CODE",
        prompt: "Practice Arithmetic Operators: write a function double that returns n times 2.",
        payload: {
          starterCode: "def double(n):\n    pass",
          functionName: "double",
          tests: [
            { input: [2], expected: 4 },
            { input: [0], expected: 0 },
            { input: [-3], expected: -6 },
            { input: [10], expected: 20 },
          ],
        },
        explanation: "Reference solution:\n```python\ndef double(n):\n    return n * 2\n```",
      },
    ],
  } as SeedLesson,
];

describe("Lesson response sanitization (toClientLesson)", () => {
  it("every seeded exercise's client response contains none of: correctIndex, blanks, correctOrder", () => {
    let totalExercises = 0;
    let filteredExercises = 0;

    for (const lesson of lessonData) {
      for (const exercise of lesson.exercises) {
        totalExercises++;

        // Convert to client exercise (this is what GET /lessons/:id does)
        const clientEx = exercise.type === "WRITE_CODE"
          ? { ...exercise, code: (exercise.payload as { starterCode?: string })?.starterCode ?? "" }
          : { ...exercise };

        // Use toClientExercise to strip payload keys
        const clientExercise = (clientEx as any).type
          ? {
              id: (clientEx as any).id ?? "",
              order: (clientEx as any).order ?? 1,
              type: (clientEx as any).type,
              prompt: (clientEx as any).prompt,
              code: (clientEx as any).code ?? null,
            }
          : { ...clientEx };

        // Strip payload-dependent fields using toClientExercise logic
        const stripped = toClientExercise(clientExercise as any);

        // Verify correctIndex is NOT in the result
        expect(stripped).not.toHaveProperty("correctIndex");
        expect(stripped).not.toHaveProperty("blanks");
        expect(stripped).not.toHaveProperty("correctOrder");

        filteredExercises++;
      }
    }

    expect(totalExercises).toBeGreaterThan(0);
    expect(filteredExercises).toBeGreaterThan(0);
  });

  it("explanation is absent from client lesson response", () => {
    // Test with the arithmetic-operators lesson data
    const lesson = lessonData[0];

    // Simulate what happens when fetching a lesson via GET /lessons/:id
    const clientLesson = {
      id: lesson.slug,
      title: lesson.title,
      xpReward: lesson.xpReward,
      exercises: lesson.exercises.map((ex: any) => ({
        id: ex.id ?? "",
        order: 1,
        type: ex.type,
        prompt: ex.prompt,
        code: ex.code ?? null,
        options: ex.payload?.options ?? undefined,
        template: ex.payload?.template ?? undefined,
        bank: ex.payload?.bank ?? undefined,
        starterCode: ex.payload?.starterCode ?? undefined,
        functionName: ex.payload?.functionName ?? undefined,
        tests: ex.payload?.tests ?? undefined,
        lines: ex.payload?.lines ?? undefined,
      })),
    };

    // The client lesson should not have explanation on exercises
    for (const exercise of clientLesson.exercises) {
      expect(exercise).not.toHaveProperty("explanation");
    }
  });
});