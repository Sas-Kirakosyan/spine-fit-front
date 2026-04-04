import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT ?? "");

const SYSTEM_INSTRUCTION =
  "You are SpineFit AI — a knowledgeable fitness assistant specializing in safe training for people with spine issues (disc bulges, herniations, especially L5-S1). You help users build workout programs, suggest safe exercises, explain proper form, and provide guidance on progressive overload while protecting the spine. Always prioritize safety. If an exercise could be risky for the spine, warn the user and suggest a safer alternative. Respond in the same language the user writes in.";

/**
 * Creates a Gemini streaming chat session.
 * Returns the async iterable stream.
 * Throws if the initial API call fails (auth, quota, etc.).
 */
export async function createChatStream(
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const contents: Content[] = messages.map((msg) => ({
    role: (msg.role === "assistant" ? "model" : "user") as "model" | "user",
    parts: [{ text: msg.content }],
  }));

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContentStream({ contents });
  return result.stream;
}
