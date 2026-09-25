const AI_API_KEY = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
const AI_TIMEOUT_MS = 10_000;

export interface DiagnosticReviewSummary {
  score: number;
  totalQuestions: number;
  percentage: number;
  placementLevel: string;
  breakdown: Record<string, { correct: number; total: number }>;
}

function titleCaseLevel(level: string): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

// Deterministic fallback that never depends on the AI service.
export function buildFallbackReview(summary: DiagnosticReviewSummary): string {
  const level = titleCaseLevel(summary.placementLevel);

  return `You scored ${summary.score} out of ${summary.totalQuestions} (${summary.percentage}%). Your current placement level is ${level}. Your diagnostic results will be used to create a personalized learning path based on your strengths and areas that need improvement.`;
}

// Generates a review based on the diagnostic result. Always resolves to a
// string: the AI review when available, otherwise the deterministic fallback.
// AI failures (missing key, timeout, unreachable, invalid response) are
// caught here and never surfaced to the caller as an error.
export async function generateDiagnosticReview(
  summary: DiagnosticReviewSummary,
): Promise<string> {
  if (!AI_API_KEY) {
    console.warn(
      "[aiReview] No AI API key configured; using fallback review.",
    );

    return buildFallbackReview(summary);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          temperature: 0.7,
          max_tokens: 250,
          messages: [
            {
              role: "system",
              content:
                "You are a supportive programming mentor writing a short, encouraging review (2-3 sentences) of a student's placement diagnostic. Refer only to the facts provided: score, percentage, placement level, and per-concept breakdown.",
            },
            {
              role: "user",
              content: `Score: ${summary.score}/${summary.totalQuestions} (${summary.percentage}%). Placement level: ${summary.placementLevel}. Concept breakdown: ${JSON.stringify(summary.breakdown)}. Write a 2-3 sentence encouraging review.`,
            },
          ],
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `[aiReview] AI request failed with status ${response.status}; using fallback review.`,
      );

      return buildFallbackReview(summary);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.warn(
        "[aiReview] AI response was empty or invalid; using fallback review.",
      );

      return buildFallbackReview(summary);
    }

    return content;
  } catch (error) {
    console.error(
      "[aiReview] AI review failed; using fallback review.",
      error,
    );

    return buildFallbackReview(summary);
  }
}