import { ActivityIndicator, Pressable, Text } from "react-native";

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full rounded-[14px] bg-main py-3 items-center justify-center shadow-lg ${
        disabled || loading ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text className="text-base font-semibold text-white">{text}</Text>
      )}
    </Pressable>
  );
}
