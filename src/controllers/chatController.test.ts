import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";

const contextMocks = vi.hoisted(() => ({
  buildUserContext: vi.fn(),
  loadUserContext: vi.fn(),
  buildQuickSummary: vi.fn(),
}));

const chatServiceMocks = vi.hoisted(() => ({
  requestChatCompletion: vi.fn(),
  chatRateLimiter: {
    consume: vi.fn(),
    take: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("../services/chatContextService.js", () => contextMocks);

vi.mock("../services/chatService.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/chatService.js")>();

  return {
    ...actual,
    requestChatCompletion: chatServiceMocks.requestChatCompletion,
    chatRateLimiter: chatServiceMocks.chatRateLimiter,
  };
});

const { chat } = await import("./chatController.js");

function makeResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };

  return response;
}

function makeRequest(message: string): AuthRequest {
  return {
    userId: "user-1",
    body: { message },
  } as AuthRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  contextMocks.buildUserContext.mockResolvedValue("Name: Ada");
  contextMocks.loadUserContext.mockResolvedValue({ firstName: "Ada" });
  contextMocks.buildQuickSummary.mockReturnValue(
    "Quick summary: you are doing well. This is a quick summary from your saved progress.",
  );
  chatServiceMocks.chatRateLimiter.consume.mockReturnValue({ ok: true });
  chatServiceMocks.requestChatCompletion.mockResolvedValue({
    ok: true,
    reply: "A for loop repeats code.",
    model: "provider/free-main",
    fallbackUsed: false,
  });
});

describe("POST /chat controller", () => {
  it("rejects messages longer than 500 characters", async () => {
    const response = makeResponse();

    await chat(makeRequest("x".repeat(501)), response as unknown as Response);

    expect(response.statusCode).toBe(400);
    expect(contextMocks.buildUserContext).not.toHaveBeenCalled();
  });

  it("returns 429 with the hourly message when the hourly cap is hit", async () => {
    chatServiceMocks.chatRateLimiter.consume.mockReturnValue({
      ok: false,
      reason: "hourly",
    });
    const response = makeResponse();

    await chat(
      makeRequest("Explain a for loop"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(429);
    expect(response.body).toEqual({
      error: { message: "Too many messages, try again in a bit." },
    });
    expect(chatServiceMocks.requestChatCompletion).not.toHaveBeenCalled();
  });

  it("returns 429 with the daily message when the daily cap is hit", async () => {
    chatServiceMocks.chatRateLimiter.consume.mockReturnValue({
      ok: false,
      reason: "daily",
    });
    const response = makeResponse();

    await chat(
      makeRequest("Explain a for loop"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(429);
    expect(response.body).toEqual({
      error: {
        message: "You've reached your daily chat limit. Try again tomorrow.",
      },
    });
    expect(chatServiceMocks.requestChatCompletion).not.toHaveBeenCalled();
  });

  it("returns the quick summary without calling OpenRouter for progress questions", async () => {
    const response = makeResponse();

    await chat(
      makeRequest("How was my last week?"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      reply:
        "Quick summary: you are doing well. This is a quick summary from your saved progress.",
    });
    expect(contextMocks.loadUserContext).toHaveBeenCalledWith("user-1");
    expect(contextMocks.buildUserContext).not.toHaveBeenCalled();
    expect(chatServiceMocks.requestChatCompletion).not.toHaveBeenCalled();
  });

  it("returns 503 when both OpenRouter models fail", async () => {
    chatServiceMocks.requestChatCompletion.mockResolvedValue({
      ok: false,
      status: 500,
      fallbackUsed: true,
    });
    const response = makeResponse();

    await chat(
      makeRequest("Explain a for loop"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      error: {
        message:
          "I could not think of an answer right now. Try again in a moment.",
      },
    });
  });

  it("returns the friendly 429 message when OpenRouter rate limits chat", async () => {
    chatServiceMocks.requestChatCompletion.mockResolvedValue({
      ok: false,
      status: 429,
      fallbackUsed: true,
    });
    const response = makeResponse();

    await chat(
      makeRequest("Explain a for loop"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(429);
    expect(response.body).toEqual({
      error: { message: "Too many messages, try again in a bit." },
    });
  });

  it("returns the OpenRouter reply on success", async () => {
    const response = makeResponse();

    await chat(
      makeRequest("Explain a for loop"),
      response as unknown as Response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ reply: "A for loop repeats code." });
    expect(contextMocks.buildUserContext).toHaveBeenCalledWith("user-1");
  });
});
