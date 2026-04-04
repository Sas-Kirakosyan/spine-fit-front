import { Router } from "express";
import type { Request, Response } from "express";
import { createChatStream } from "../services/chatService.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { messages } = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  try {
    const stream = await createChatStream(messages);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    for await (const chunk of stream) {
      if (closed) break;
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (!closed) {
      res.write("data: [DONE]\n\n");
    }
    res.end();
  } catch (error) {
    console.error("[chat] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
});

export default router;
