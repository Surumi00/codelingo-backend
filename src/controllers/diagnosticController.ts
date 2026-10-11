import type { Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  diagnosticAttempts,
  diagnosticQuestions,
  syllabusLevels,
} from "../db/schema.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { placementLevelFromPercentage } from "../services/placementService.js";
import { generateReview } from "../services/reviewService.js";

const DIAGNOSTIC_QUESTION_COUNT = 15;

const safeQuestionColumns = {
  id: diagnosticQuestions.id,
  conceptSlug: diagnosticQuestions.conceptSlug,
  difficulty: diagnosticQuestions.difficulty,
  prompt: diagnosticQuestions.prompt,
  options: diagnosticQuestions.options,
};

function titleCaseLevel(level: string): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

// GET /diagnostic/questions
export async function getDiagnosticQuestions(
  req: AuthRequest,
  res: Response,
) {
  try {
    const questions = await db
      .select(safeQuestionColumns)
      .from(diagnosticQuestions);

    if (questions.length < DIAGNOSTIC_QUESTION_COUNT) {
      return res.status(500).json({
        error: {
          message: `The database contains only ${questions.length} diagnostic questions, but ${DIAGNOSTIC_QUESTION_COUNT} are required.`,
        },
      });
    }

    if (questions.length !== DIAGNOSTIC_QUESTION_COUNT) {
      console.warn(
        `The database contains ${questions.length} diagnostic questions; returning the first ${DIAGNOSTIC_QUESTION_COUNT}.`,
      );
    }

    res.json({ questions: questions.slice(0, DIAGNOSTIC_QUESTION_COUNT) });
  } catch (error) {
    console.error("Error fetching diagnostic questions:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}

// POST /diagnostic/submit
export async function submitDiagnostic(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const { answers } = req.body as { answers?: unknown };

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        error: { message: "answers must be an array" },
      });
    }

    if (answers.length !== DIAGNOSTIC_QUESTION_COUNT) {
      return res.status(400).json({
        error: {
          message: `Exactly ${DIAGNOSTIC_QUESTION_COUNT} answers are required.`,
        },
      });
    }

    const submitted: Array<{ questionId: number; optionIndex: number }> = [];
    const seenIds = new Set<number>();

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i] as {
        questionId?: unknown;
        selectedOptionIndex?: unknown;
      };

      const questionId = Number(answer?.questionId);
      const optionIndex = Number(answer?.selectedOptionIndex);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({
          error: { message: `Invalid questionId at index ${i}.` },
        });
      }

      if (seenIds.has(questionId)) {
        return res.status(400).json({
          error: { message: `Duplicate questionId ${questionId}.` },
        });
      }

      if (
        !Number.isInteger(optionIndex) ||
        optionIndex < 0
      ) {
        return res.status(400).json({
          error: { message: `Invalid selectedOptionIndex at index ${i}.` },
        });
      }

      seenIds.add(questionId);
      submitted.push({ questionId, optionIndex });
    }

    // The answer key is read from the database only; the frontend never
    // supplies correct answers or a score.
    const questions = await db
      .select({
        id: diagnosticQuestions.id,
        conceptSlug: diagnosticQuestions.conceptSlug,
        options: diagnosticQuestions.options,
        correctOptionIndex: diagnosticQuestions.correctOptionIndex,
      })
      .from(diagnosticQuestions)
      .where(
        inArray(
          diagnosticQuestions.id,
          submitted.map((answer) => answer.questionId),
        ),
      );

    if (questions.length !== submitted.length) {
      return res.status(404).json({
        error: { message: "One or more questions do not exist." },
      });
    }

    const questionMap = new Map(
      questions.map((question) => [question.id, question]),
    );

    let score = 0;
    const breakdown: Record<string, { correct: number; total: number }> = {};

    for (const answer of submitted) {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        return res.status(404).json({
          error: { message: `Question ${answer.questionId} does not exist.` },
        });
      }

      if (answer.optionIndex >= question.options.length) {
        return res.status(400).json({
          error: {
            message: `Invalid option index ${answer.optionIndex} for question ${answer.questionId}.`,
          },
        });
      }

      const isCorrect = answer.optionIndex === question.correctOptionIndex;

      if (isCorrect) {
        score += 1;
      }

      const entry = breakdown[question.conceptSlug] ?? {
        correct: 0,
        total: 0,
      };

      entry.total += 1;

      if (isCorrect) {
        entry.correct += 1;
      }

      breakdown[question.conceptSlug] = entry;
    }

    const totalQuestions = submitted.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const level = placementLevelFromPercentage(percentage);

    const [startingSyllabusLevel] = await db
      .select({
        id: syllabusLevels.id,
        title: syllabusLevels.title,
      })
      .from(syllabusLevels)
      .where(eq(syllabusLevels.title, titleCaseLevel(level)));

    if (!startingSyllabusLevel) {
      return res.status(500).json({
        error: {
          message: `Syllabus level for '${level}' was not found. Seed the syllabus_levels table.`,
        },
      });
    }

    const review = await generateReview(score, breakdown, level);

    await db.insert(diagnosticAttempts).values({
      userId: req.userId,
      score,
      totalQuestions,
      percentage,
      placementLevel: level,
      startingSyllabusLevelId: startingSyllabusLevel.id,
      review,
      breakdown,
    });

    res.json({
      score,
      totalQuestions,
      percentage,
      level,
      review,
      startingSyllabusLevel,
      breakdown,
    });
  } catch (error) {
    console.error("Error submitting diagnostic:", error);

    res.status(500).json({ error: { message: "Internal server error" } });
  }
}