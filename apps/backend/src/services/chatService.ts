import { streamText } from "ai";

const SYSTEM_INSTRUCTION =
  "You are SpineFit AI — a knowledgeable fitness assistant specializing in safe training for people with spine issues (disc bulges, herniations, especially L5-S1). You help users build workout programs, suggest safe exercises, explain proper form, and provide guidance on progressive overload while protecting the spine. Always prioritize safety. If an exercise could be risky for the spine, warn the user and suggest a safer alternative. Respond in the same language the user writes in.";

// AI Gateway model ID; override via CHAT_MODEL env var. Gateway's free tier
// rejects preview models and the newest generations — stick to a model
// confirmed to work on free credits.
const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash-lite";

/**
 * Starts a streaming chat completion via AI Gateway.
 * Returns an async iterable of text deltas (plain strings).
 *
 * Iterates result.stream (not textStream): stream errors arrive as
 * `{type: 'error'}` parts that textStream silently swallows — rethrowing them
 * here lets the route's catch send the client its `data: {"error": ...}` frame.
 */
export function createChatStream(
  messages: { role: "user" | "assistant"; content: string }[],
): AsyncIterable<string> {
  const result = streamText({
    model: process.env.CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
    system: SYSTEM_INSTRUCTION,
    messages,
    temperature: 0.6,
  });

  return (async function* () {
    for await (const part of result.stream) {
      if (part.type === "text-delta") {
        yield part.text;
      } else if (part.type === "error") {
        throw part.error instanceof Error
          ? part.error
          : new Error(String(part.error));
      }
    }
  })();
}
