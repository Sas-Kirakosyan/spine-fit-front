import { Pressable, Text, View } from "react-native";

interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  onPress: () => void;
}

export function AuthSwitchLink({ question, linkText, onPress }: AuthSwitchLinkProps) {
  return (
    <View className="flex-row items-center justify-center gap-1 py-4">
      <Text className="text-sm text-white/70">{question}</Text>
      <Pressable onPress={onPress}>
        <Text className="text-sm font-medium text-white underline">{linkText}</Text>
      </Pressable>
    </View>
  );
}
