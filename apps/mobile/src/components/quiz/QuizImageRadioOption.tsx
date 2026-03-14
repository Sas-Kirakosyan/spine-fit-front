import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";

interface QuizImageRadioOptionProps {
  option: { value: string; label: string; image: string; description: string };
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function QuizImageRadioOption({
  option,
  index,
  isSelected,
  onSelect,
}: QuizImageRadioOptionProps) {
  return (
    <Pressable
      onPress={() => onSelect(index)}
      className={`w-full rounded-lg border-2 p-4 ${
        isSelected ? "border-main bg-main/10" : "border-gray-200"
      }`}
    >
      <View className="flex-row items-start gap-4">
        {option.image && (
          <View className="bg-gray-100 rounded-lg p-3">
            <Image
              source={{ uri: option.image }}
              style={{ width: 112, height: 112 }}
              contentFit="contain"
            />
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-900">{option.label}</Text>
            <View
              className={`h-5 w-5 items-center justify-center rounded-full ${
                isSelected ? "bg-main" : "border-2 border-gray-300"
              }`}
            >
              {isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
            </View>
          </View>
          {option.description && (
            <Text className="mt-1 text-sm text-gray-600">{option.description}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
