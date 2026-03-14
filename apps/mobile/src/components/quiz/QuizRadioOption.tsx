import { View, Text, Pressable } from "react-native";

interface QuizRadioOptionProps {
  option: string | { value: string; label: string; image: string; description: string };
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function QuizRadioOption({ option, index, isSelected, onSelect }: QuizRadioOptionProps) {
  const displayText = typeof option === "string" ? option : option.label;

  return (
    <Pressable
      onPress={() => onSelect(index)}
      className={`w-full rounded-lg border-2 p-4 ${
        isSelected ? "border-main bg-main/10" : "border-gray-200"
      }`}
    >
      <View className="flex-row items-center">
        <View
          className={`mr-3 h-6 w-6 items-center justify-center rounded-full ${
            isSelected ? "bg-main" : "border-2 border-gray-300 bg-white"
          }`}
        >
          {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-white" />}
        </View>
        <Text className={`font-medium ${isSelected ? "text-main" : "text-gray-800"}`}>
          {displayText}
        </Text>
      </View>
    </Pressable>
  );
}
