import type { ChatMessage } from "@/types/chat";

const GEMINI_API_KEY = import.meta.env.VITE_AI_ASSISTANT_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiStreamChunk {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
      role?: string;
    };
    finishReason?: string;
  }[];
}

/**
 * Отправляет сообщение в Gemini API с поддержкой streaming
 * @param messages История сообщений для контекста
 * @param onChunk Callback для обработки каждого чанка streaming ответа
 * @returns Promise с полным ответом
 */
export async function sendMessageToGemini(
  messages: GeminiMessage[],
  onChunk: (content: string) => void
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file."
    );
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages,
        systemInstruction: {
          parts: [
            {
              text: "You are SpineFit AI — a knowledgeable fitness assistant specializing in safe training for people with spine issues (disc bulges, herniations, especially L5-S1). You help users build workout programs, suggest safe exercises, explain proper form, and provide guidance on progressive overload while protecting the spine. Always prioritize safety. If an exercise could be risky for the spine, warn the user and suggest a safer alternative. Respond in the same language the user writes in.",
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") {
              return fullResponse;
            }

            const data = JSON.parse(jsonStr) as GeminiStreamChunk;

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullResponse += text;
              onChunk(text);
            }

            const finishReason = data.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== "STOP") {
              console.warn("Gemini finish reason:", finishReason);
            }
          } catch (e) {
            // Игнорируем ошибки парсинга отдельных чанков
            console.warn("Failed to parse chunk:", line, e);
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while communicating with Gemini");
  }
}

/**
 * Конвертирует ChatMessage в формат Gemini
 */
export function chatMessageToGemini(message: ChatMessage): GeminiMessage {
  return {
    // Gemini использует "model" вместо "assistant"
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  };
}
