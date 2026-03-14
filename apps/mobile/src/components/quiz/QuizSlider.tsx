import { View, Text, Pressable } from "react-native";
import Slider from "@react-native-community/slider";

interface QuizSliderProps {
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}

const getColor = (val: number, min: number, max: number) => {
  const percent = (val - min) / (max - min);
  if (percent <= 0.3) return "#10b981";
  if (percent <= 0.5) return "#84cc16";
  if (percent <= 0.7) return "#eab308";
  if (percent <= 0.85) return "#f97316";
  return "#ef4444";
};

export function QuizSlider({ value, min, max, onChange }: QuizSliderProps) {
  const numValue = value ? parseFloat(value) : min;
  const currentColor = getColor(numValue, min, max);
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <View className="gap-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-500">No pain</Text>
        <Text className="text-3xl font-bold" style={{ color: currentColor }}>
          {value || min}
        </Text>
        <Text className="text-sm text-gray-500">Worst pain</Text>
      </View>

      <View className="flex-row flex-wrap justify-between mt-2 px-1 gap-y-2">
        {numbers.map((num) => {
          const numColor = getColor(num, min, max);
          const isActive = numValue === num;
          return (
            <Pressable
              key={num}
              onPress={() => onChange(num.toString())}
              className={`w-7 h-7 rounded-full items-center justify-center ${
                !isActive ? "bg-gray-100" : ""
              }`}
              style={isActive ? { backgroundColor: numColor } : undefined}
            >
              <Text
                className={`text-xs ${isActive ? "text-white font-semibold" : "text-gray-400"}`}
              >
                {num}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
