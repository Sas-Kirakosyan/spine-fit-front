import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface SubmitButtonProps {
  text: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SubmitButton({
  text,
  onPress,
  disabled = false,
  loading = false,
}: SubmitButtonProps) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      className={`w-full rounded-[14px] bg-main py-3 items-center justify-center shadow-lg ${
        isInactive ? "opacity-60" : ""
      }`}
      style={({ pressed }) => (pressed && !isInactive ? { opacity: 0.9 } : undefined)}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading && <ActivityIndicator size="small" color="#ffffff" />}
        <Text className="text-sm font-semibold text-white">{text}</Text>
      </View>
    </Pressable>
  );
}
