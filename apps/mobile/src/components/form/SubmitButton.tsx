import { Pressable, Text } from "react-native";

interface SubmitButtonProps {
  text: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function SubmitButton({ text, onPress, disabled = false }: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full rounded-[14px] bg-main py-3 items-center shadow-lg ${disabled ? "opacity-50" : ""}`}
    >
      <Text className="text-base font-semibold text-white">{text}</Text>
    </Pressable>
  );
}
