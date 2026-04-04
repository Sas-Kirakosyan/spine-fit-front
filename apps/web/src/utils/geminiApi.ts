const API_URL = `${import.meta.env.VITE_GENARATE_PLAN_API}/api/chat`;

/**
 * Sends chat messages to the backend and streams the response via SSE.
 */
export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[],
  onChunk: (content: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Chat API error: ${response.status} ${response.statusText} - ${errorText}`
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
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") {
          return fullResponse;
        }

        try {
          const data = JSON.parse(jsonStr) as {
            text?: string;
            error?: string;
          };

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.text) {
            fullResponse += data.text;
            onChunk(data.text);
          }
        } catch (e) {
          if (e instanceof Error && e.message !== jsonStr) {
            throw e;
          }
          console.warn("Failed to parse chunk:", line);
        }
      }
    }
  }

  return fullResponse;
}
