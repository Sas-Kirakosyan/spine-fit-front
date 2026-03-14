import { View, Text } from "react-native";

interface DividerProps {
  text?: string;
}

export function Divider({ text = "Or continue with" }: DividerProps) {
  return (
    <View className="flex-row items-center gap-3 my-2">
      <View className="flex-1 h-px bg-gray-300" />
      <Text className="text-sm text-gray-400">{text}</Text>
      <View className="flex-1 h-px bg-gray-300" />
    </View>
  );
}
