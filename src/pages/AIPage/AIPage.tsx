import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import type { AIPageProps } from "@/types/pages";
import type { ChatMessage } from "@/types/chat";
import { MessageList } from "@/components/Chat/MessageList";
import { MessageInput } from "@/components/Chat/MessageInput";
import {
  sendMessageToGemini,
  chatMessageToGemini,
  type GeminiMessage,
} from "@/utils/geminiApi";

const CHAT_HISTORY_KEY = "aiChatHistory";
const MAX_HISTORY_MESSAGES = 50;

export function AIPage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToAI,
  activePage,
}: AIPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingMessageRef = useRef<string>("");

  // Загрузка истории из localStorage при монтировании
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedMessages: ChatMessage[] = JSON.parse(savedHistory);
        // Конвертируем строковые даты обратно в Date объекты
        const messagesWithDates = parsedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, []);

  // Сохранение истории в localStorage при изменении
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Ограничиваем количество сообщений для сохранения
        const messagesToSave = messages.slice(-MAX_HISTORY_MESSAGES);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
      } catch (err) {
        console.error("Failed to save chat history:", err);
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Добавляем сообщение пользователя
    const userMessage: ChatMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    streamingMessageRef.current = "";

    try {
      // Подготавливаем историю сообщений для Gemini
      const geminiMessages: GeminiMessage[] = [
        ...messages.map(chatMessageToGemini),
        chatMessageToGemini(userMessage),
      ];

      // Отправляем запрос с обработкой streaming
      await sendMessageToGemini(geminiMessages, (chunk: string) => {
        streamingMessageRef.current += chunk;
        
        // Обновляем последнее сообщение ассистента или создаем новое
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          
          // Если последнее сообщение - это сообщение ассистента, обновляем его
          if (lastMessage && lastMessage.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: streamingMessageRef.current,
              },
            ];
          }
          
          // Иначе создаем новое сообщение
          return [
            ...prev,
            {
              role: "assistant" as const,
              content: streamingMessageRef.current,
              timestamp: new Date(),
            },
          ];
        });
      });

      // Финальное сообщение ассистента
      const finalAssistantMessage: ChatMessage = {
        role: "assistant",
        content: streamingMessageRef.current,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        // Удаляем временное сообщение и добавляем финальное
        const withoutLast = prev[prev.length - 1]?.role === "assistant" 
          ? prev.slice(0, -1) 
          : prev;
        return [...withoutLast, finalAssistantMessage];
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Не удалось подключиться к Gemini API. Проверьте подключение к интернету.";
      
      setError(errorMessage);
      
      // Добавляем сообщение об ошибке
      const errorChatMessage: ChatMessage = {
        role: "assistant",
        content: `Ошибка: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      streamingMessageRef.current = "";
    }
  };

  return (
    <PageContainer contentClassName="gap-6 pb-24">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <h1 className="mt-3 text-3xl mx-2.5 font-semibold text-white">
            AI Assistant
          </h1>
          <p className="mt-1 text-sm text-slate-300 mx-2.5">
            Your personal AI assistant for fitness
          </p>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-4 rounded-[14px] bg-[#1B1E2B]/80 p-5 text-slate-100 shadow-xl ring-1 ring-white/5 overflow-hidden min-h-0">
        {error && (
          <div className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />

        <div className="pt-2 border-t border-white/10">
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!!error}
          />
        </div>
      </section>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
          onAIClick={onNavigateToAI}
        />
      </div>
    </PageContainer>
  );
}
