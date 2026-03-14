import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage } from "@spinefit/shared";
import { Logo } from "../components/common/Logo";
import {
  sendMessageToGemini,
  chatMessageToGemini,
  type GeminiMessage,
} from "../utils/geminiApi";
import Svg, { Path } from "react-native-svg";

const CHAT_HISTORY_KEY = "aiChatHistory";
const MAX_HISTORY_MESSAGES = 50;

function SendIcon({ size = 20, color = "white" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 2L11 13" />
      <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  );
}

export default function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef("");
  const scrollRef = useRef<ScrollView>(null);

  // Load chat history
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (saved) {
          const parsed: ChatMessage[] = JSON.parse(saved);
          setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      } catch {}
    })();
  }, []);

  // Save chat history on change
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-MAX_HISTORY_MESSAGES);
      AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave)).catch(() => {});
    }
  }, [messages]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, isLoading, scrollToEnd]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    streamingRef.current = "";

    try {
      const geminiMessages: GeminiMessage[] = [
        ...messages.map(chatMessageToGemini),
        chatMessageToGemini(userMessage),
      ];

      await sendMessageToGemini(geminiMessages, (chunk: string) => {
        streamingRef.current += chunk;

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: streamingRef.current },
            ];
          }
          return [
            ...prev,
            {
              role: "assistant" as const,
              content: streamingRef.current,
              timestamp: new Date(),
            },
          ];
        });
      });

      // Finalize
      const finalMsg: ChatMessage = {
        role: "assistant",
        content: streamingRef.current,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const withoutLast =
          prev[prev.length - 1]?.role === "assistant" ? prev.slice(0, -1) : prev;
        return [...withoutLast, finalMsg];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect to AI";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      streamingRef.current = "";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-2">
        <Logo size="sm" />
        <Text className="text-white text-2xl font-bold mt-1 ml-2">AI Assistant</Text>
        <Text className="text-white/40 text-sm ml-2">Your personal fitness AI</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 8, paddingTop: 8, gap: 12 }}
          onContentSizeChange={scrollToEnd}
        >
          {messages.length === 0 && !isLoading && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-white/30 text-sm text-center px-8">
                Start a conversation with your AI assistant. Ask about workouts, nutrition, or exercise programs.
              </Text>
            </View>
          )}

          {messages.map((msg, i) => (
            <View
              key={i}
              className={`flex-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#e77d10]"
                    : "bg-[#1B1E2B] border border-white/5"
                }`}
              >
                <Text className="text-white text-sm leading-5">{msg.content}</Text>
                <Text
                  className={`text-[10px] mt-1 ${
                    msg.role === "user" ? "text-white/70" : "text-white/30"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <View className="flex-row justify-start">
              <View className="bg-[#1B1E2B] border border-white/5 rounded-2xl px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#e77d10" />
                  <Text className="text-white/40 text-xs">AI is typing...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Error banner */}
        {error && (
          <View className="mx-4 mb-2 rounded-xl bg-red-900/30 border border-red-500/30 px-4 py-2">
            <Text className="text-red-300 text-xs">{error}</Text>
          </View>
        )}

        {/* Input */}
        <View className="flex-row items-end gap-2 px-4 py-3 border-t border-white/10">
          <TextInput
            className="flex-1 rounded-2xl border border-white/20 bg-transparent px-4 py-3 text-white text-sm"
            placeholder="Type a message..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            editable={!isLoading}
            style={{ maxHeight: 100 }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            className={`h-12 w-12 rounded-2xl items-center justify-center ${
              input.trim() && !isLoading ? "bg-[#e77d10]" : "bg-white/10"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <SendIcon />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
