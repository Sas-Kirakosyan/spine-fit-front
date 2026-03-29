import { View, Text, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";

interface QuizCheckboxOptionProps {
  option: string | { value: string; label: string; image: string; description?: string };
  index: number;
  isSelected: boolean;
  onToggle: (index: number) => void;
}

export function QuizCheckboxOption({
  option,
  index,
  isSelected,
  onToggle,
}: QuizCheckboxOptionProps) {
  const displayText = typeof option === "string" ? option : option.label;

  return (
    <Pressable
      onPress={() => onToggle(index)}
      className={`w-full rounded-lg border-2 p-4 ${
        isSelected ? "border-main bg-main/10" : "border-gray-200"
      }`}
    >
      <View className="flex-row items-center">
        <View
          className={`mr-3 h-5 w-5 items-center justify-center rounded ${
            isSelected ? "bg-main" : "border-2 border-gray-300"
          }`}
        >
          {isSelected && (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 13l4 4L19 7" />
            </Svg>
          )}
        </View>
        <Text className={`font-medium ${isSelected ? "text-main" : "text-gray-800"}`}>
          {displayText}
        </Text>
      </View>
    </Pressable>
  );
}
