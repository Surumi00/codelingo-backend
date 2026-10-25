import { describe, it, expect } from "vitest";
import { gradeAnswer, computeXp, computeAccuracy } from "./exerciseService.js";

function makeMCChoiceExercise() {
  return {
    type: "MULTIPLE_CHOICE",
    payload: {
      options: ["A", "B", "C", "D"],
      correctIndex: 1,
    },
  };
}

function makePredictOutputExercise() {
  return {
    type: "PREDICT_OUTPUT",
    payload: {
      options: ["2", "2.33", "3", "10"],
      correctIndex: 0,
    },
  };
}

function makeFixBugExercise() {
  return {
    type: "FIX_BUG",
    payload: {
      options: [
        "print(5 + 2 + 3)",
        "print(5 * 2 + 3)",
        "print(5 - 2 * 3)",
        "print(5 + 2 * 3)",
      ],
      correctIndex: 3,
    },
  };
}

function makeFillBlankExercise() {
  return {
    type: "FILL_BLANK",
    payload: {
      template: "print(10 {{b1}} 3)",
      bank: ["%", "/", "//", "*"],
      blanks: { b1: ["%"] },
    },
  };
}

function makeArrangeLinesExercise() {
  return {
    type: "ARRANGE_LINES",
    payload: {
      lines: [
        { id: "l1", text: "price = 10" },
        { id: "l2", text: "tax = 2" },
        { id: "l3", text: "total = price + tax" },
        { id: "l4", text: "print(total)" },
      ],
      correctOrder: ["l1", "l2", "l3", "l4"],
    },
  };
}

function makeWriteCodeExercise() {
  return {
    type: "WRITE_CODE",
    payload: {
      starterCode: "def double(n):\n    pass",
      functionName: "double",
      tests: [{ input: [2], expected: 4 }],
    },
  };
}

describe("gradeAnswer", () => {
  // MULTIPLE_CHOICE
  it("MULTIPLE_CHOICE: returns correct when selectedIndex matches correctIndex", () => {
    const exercise = makeMCChoiceExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("MULTIPLE_CHOICE: returns incorrect when selectedIndex does not match correctIndex", () => {
    const exercise = makeMCChoiceExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // PREDICT_OUTPUT
  it("PREDICT_OUTPUT: returns correct when selectedIndex matches correctIndex", () => {
    const exercise = makePredictOutputExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("PREDICT_OUTPUT: returns incorrect when selectedIndex does not match correctIndex", () => {
    const exercise = makePredictOutputExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // FIX_BUG
  it("FIX_BUG: returns correct when selectedIndex matches correctIndex", () => {
    const exercise = makeFixBugExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("FIX_BUG: returns incorrect when selectedIndex does not match correctIndex", () => {
    const exercise = makeFixBugExercise();
    const result = gradeAnswer(exercise as any, { selectedIndex: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // FILL_BLANK
  it("FILL_BLANK: returns correct when blanks match", () => {
    const exercise = makeFillBlankExercise();
    const result = gradeAnswer(exercise as any, { blanks: { b1: "%" } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("FILL_BLANK: returns incorrect when blanks do not match", () => {
    const exercise = makeFillBlankExercise();
    const result = gradeAnswer(exercise as any, { blanks: { b1: "/" } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // ARRANGE_LINES
  it("ARRANGE_LINES: returns correct when order matches correctOrder", () => {
    const exercise = makeArrangeLinesExercise();
    const result = gradeAnswer(exercise as any, { order: ["l1", "l2", "l3", "l4"] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("ARRANGE_LINES: returns incorrect when order does not match correctOrder", () => {
    const exercise = makeArrangeLinesExercise();
    const result = gradeAnswer(exercise as any, { order: ["l2", "l1", "l3", "l4"] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // WRITE_CODE
  it("WRITE_CODE: returns correct when passed is true", () => {
    const exercise = makeWriteCodeExercise();
    const result = gradeAnswer(exercise as any, { code: "def double(n): return n * 2", passed: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(true);
    }
  });

  it("WRITE_CODE: returns incorrect when passed is false", () => {
    const exercise = makeWriteCodeExercise();
    const result = gradeAnswer(exercise as any, { code: "def double(n): return n + 2", passed: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isCorrect).toBe(false);
    }
  });

  // malformed answer shape
  it("malformed answer: returns error when raw is null", () => {
    const exercise = makeMCChoiceExercise();
    const result = gradeAnswer(exercise as any, null as any);
    expect(result.ok).toBe(false);
  });

  it("malformed answer: returns error when raw is array", () => {
    const exercise = makeMCChoiceExercise();
    const result = gradeAnswer(exercise as any, [1, 2, 3] as any);
    expect(result.ok).toBe(false);
  });

  it("malformed answer: returns error when raw is not an object", () => {
    const exercise = makeMCChoiceExercise();
    const result = gradeAnswer(exercise as any, "invalid" as any);
    expect(result.ok).toBe(false);
  });
});

describe("computeXp", () => {
  it("first completion: returns xpReward + 5 for perfect accuracy", () => {
    const result = computeXp(5, 1, false);
    expect(result).toBe(10);
  });

  it("first completion: returns xpReward when accuracy is not perfect", () => {
    const result = computeXp(5, 0.8, false);
    expect(result).toBe(5);
  });

  it("perfect first completion: returns xpReward + 5", () => {
    const result = computeXp(10, 1, false);
    expect(result).toBe(15);
  });

  it("replay: returns 2", () => {
    const result = computeXp(10, 1, true);
    expect(result).toBe(2);
  });

  it("replay with low accuracy: returns 2", () => {
    const result = computeXp(10, 0.5, true);
    expect(result).toBe(2);
  });
});

describe("computeAccuracy", () => {
  it("returns 0 when there are no exercises", () => {
    const result = computeAccuracy([], []);
    expect(result).toBe(0);
  });

  it("returns ratio of first-attempt correct exercises", () => {
    const result = computeAccuracy(
      [{ id: "1" }, { id: "2" }, { id: "3" }],
      [
        { exerciseId: "1", correct: true },
        { exerciseId: "2", correct: true },
        { exerciseId: "3", correct: false },
      ]
    );
    expect(result).toBe(2 / 3);
  });
});