import { Pressable, Text, View } from "react-native";

interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  onPress: () => void;
  /** "onDark" for the auth screens' navy background, "onLight" for white cards. */
  variant?: "onDark" | "onLight";
}

export function AuthSwitchLink({
  question,
  linkText,
  onPress,
  variant = "onDark",
}: AuthSwitchLinkProps) {
  const isOnLight = variant === "onLight";
  return (
    <View className="mt-6 mb-4 flex-row items-center justify-center gap-1">
      <Text className={`text-sm ${isOnLight ? "text-gray-600" : "text-white"}`}>
        {question}
      </Text>
      <Pressable onPress={onPress}>
        <Text
          className={`text-sm font-medium ${isOnLight ? "text-main" : "text-white"}`}
        >
          {linkText}
        </Text>
      </Pressable>
    </View>
  );
}
