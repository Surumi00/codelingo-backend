import type { PlacementLevel } from "./placementService.js";

export type ConceptBreakdown = Record<
  string,
  { correct: number; total: number }
>;

const AI_API_KEY = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
const AI_TIMEOUT_MS = 7000;

interface ConceptRatio {
  slug: string;
  ratio: number;
}

function conceptRatios(breakdown: ConceptBreakdown): ConceptRatio[] {
  return Object.entries(breakdown).map(([slug, entry]) => ({
    slug,
    ratio: entry.total > 0 ? entry.correct / entry.total : 0,
  }));
}

function strongestAndWeakest(breakdown: ConceptBreakdown): {
  strongest?: ConceptRatio;
  weakest?: ConceptRatio;
} {
  const ratios = conceptRatios(breakdown);

  if (ratios.length === 0) {
    return {};
  }

  let strongest = ratios[0];
  let weakest = ratios[0];

  for (const concept of ratios) {
    if (concept.ratio > strongest.ratio) strongest = concept;
    if (concept.ratio < weakest.ratio) weakest = concept;
  }

  return { strongest, weakest };
}

function totalQuestions(breakdown: ConceptBreakdown): number {
  return Object.values(breakdown).reduce(
    (sum, entry) => sum + entry.total,
    0,
  );
}

// Deterministic fallback that never depends on the network.
export function buildFallbackReview(
  score: number,
  breakdown: ConceptBreakdown,
  level: PlacementLevel,
): string {
  const total = totalQuestions(breakdown);
  const { strongest, weakest } = strongestAndWeakest(breakdown);

  if (!strongest || !weakest) {
    const prefix = total > 0 ? `You scored ${score} out of ${total}. ` : "";

    return `${prefix}Your diagnostic results will be used to create a personalized learning path based on your strengths and areas that need improvement.`;
  }

  if (strongest.slug === weakest.slug) {
    return `You scored ${score} out of ${total}. Keep practicing ${strongest.slug} to continue building your skills.`;
  }

  return `You're strongest in ${strongest.slug} and could use more practice with ${weakest.slug}. Keep building on what's working and your weak areas will catch up.`;
}

// Generates a short review for a diagnostic result. Always resolves to a
// non-empty string: the AI review when available, otherwise the deterministic
// fallback. AI failures (missing key, invalid key, timeout, network error,
// non-2xx response, malformed/empty response) are caught here and never
// surface to the caller as an error.
export async function generateReview(
  score: number,
  breakdown: ConceptBreakdown,
  level: PlacementLevel,
): Promise<string> {
  if (!AI_API_KEY) {
    console.warn("[review] No AI API key configured; using fallback review.");

    return buildFallbackReview(score, breakdown, level);
  }

  let strongest: ConceptRatio | undefined;
  let weakest: ConceptRatio | undefined;

  try {
    ({ strongest, weakest } = strongestAndWeakest(breakdown));
    const total = totalQuestions(breakdown);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
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
                  "You are a supportive programming mentor reviewing a student's placement diagnostic. Write only 2-3 short, encouraging sentences. Mention one real strong concept and one real weak concept from the supplied breakdown. Do not invent concepts. Do not invent scores or facts. Use the supplied placement level when useful.",
              },
              {
                role: "user",
                content:
                  `Score: ${score}/${total}\nPlacement level: ${level}\nBreakdown:\n${JSON.stringify(breakdown)}\n` +
                  `Strongest concept: ${strongest?.slug ?? "none"}\nWeakest concept: ${weakest?.slug ?? "none"}`,
              },
            ],
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        console.warn(
          `[review] AI request failed with status ${response.status}; using fallback review.`,
        );

        return buildFallbackReview(score, breakdown, level);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        console.warn(
          "[review] AI response was empty or invalid; using fallback review.",
        );

        return buildFallbackReview(score, breakdown, level);
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error(
      "[review] AI review failed; using fallback review.",
      error,
    );

    return buildFallbackReview(score, breakdown, level);
  }
}