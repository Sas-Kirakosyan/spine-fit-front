import type { ChatMessage } from "@spinefit/shared";

const GEMINI_API_KEY = "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

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

export async function sendMessageToGemini(
  messages: GeminiMessage[],
  onChunk: (content: string) => void
): Promise<string> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") return fullResponse;

            const data = JSON.parse(jsonStr) as GeminiStreamChunk;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullResponse += text;
              onChunk(text);
            }
          } catch {
            // Ignore chunk parsing errors
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown error communicating with Gemini");
  }
}

export function chatMessageToGemini(message: ChatMessage): GeminiMessage {
  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  };
}
