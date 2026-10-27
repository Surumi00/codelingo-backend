import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import {
  buildQuickSummary,
  buildUserContext,
  loadUserContext,
} from "../services/chatContextService.js";
import {
  buildOpenRouterMessages,
  chatRateLimiter,
  isProgressQuestion,
  requestChatCompletion,
  validateChatRequest,
} from "../services/chatService.js";

const OPENROUTER_FAILURE_MESSAGE =
  "I could not think of an answer right now. Try again in a moment.";
const RATE_LIMIT_MESSAGES = {
  hourly: "Too many messages, try again in a bit.",
  daily: "You've reached your daily chat limit. Try again tomorrow.",
  global: "Chat is taking a break right now. Try again later.",
};

// POST /chat
export async function chat(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  const validation = validateChatRequest(req.body);

  if (!validation.ok) {
    return res.status(400).json({ error: { message: validation.message } });
  }

  const limit = chatRateLimiter.consume(req.userId);

  if (!limit.ok) {
    return res.status(429).json({
      error: { message: RATE_LIMIT_MESSAGES[limit.reason] },
    });
  }

  const { message, history } = validation.value;

  try {
    if (isProgressQuestion(message)) {
      const contextData = await loadUserContext(req.userId);

      return res.json({ reply: buildQuickSummary(contextData) });
    }

    const context = await buildUserContext(req.userId);
    const messages = buildOpenRouterMessages(context, history, message);
    const completion = await requestChatCompletion(messages);

    if (!completion.ok) {
      if (completion.status === 429) {
        return res.status(429).json({
          error: { message: RATE_LIMIT_MESSAGES.hourly },
        });
      }

      return res.status(503).json({
        error: { message: OPENROUTER_FAILURE_MESSAGE },
      });
    }

    return res.json({ reply: completion.reply });
  } catch {
    console.error("[chat] context status=failed");

    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}
