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
  return (
    <View className="flex-row mb-4 items-center justify-center gap-1 py-4">
      <Text
        className={`text-md ${
          variant === "onLight" ? "text-gray-500" : "text-white/70"
        }`}
      >
        {question}
      </Text>
      <Pressable onPress={onPress}>
        <Text className="text-sm font-medium text-main">{linkText}</Text>
      </Pressable>
    </View>
  );
}
