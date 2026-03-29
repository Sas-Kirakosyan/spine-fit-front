import { View, Text, Pressable, PanResponder } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";

interface QuizSliderProps {
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}

const THUMB_SIZE = 24;

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

  const [trackWidth, setTrackWidth] = useState(0);
  const stateRef = useRef({ min, max, onChange, trackWidth });
  stateRef.current = { min, max, onChange, trackWidth };

  const computeValue = (x: number) => {
    const { min, max, trackWidth } = stateRef.current;
    const usable = trackWidth - THUMB_SIZE;
    const ratio = Math.max(0, Math.min(1, (x - THUMB_SIZE / 2) / usable));
    return Math.round(min + ratio * (max - min));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        stateRef.current.onChange(computeValue(e.nativeEvent.locationX).toString());
      },
      onPanResponderMove: (e) => {
        stateRef.current.onChange(computeValue(e.nativeEvent.locationX).toString());
      },
    })
  ).current;

  const thumbLeft =
    trackWidth > 0
      ? ((numValue - min) / (max - min)) * (trackWidth - THUMB_SIZE)
      : 0;

  return (
    <View className="gap-4">
      {/* Header row */}
      <View className="flex-row justify-between items-center">
        <Text className="text-lg text-gray-500">No pain</Text>
        <Text className="text-4xl font-bold" style={{ color: currentColor }}>
          {value || min}
        </Text>
        <Text className="text-lg text-gray-500">Worst pain</Text>
      </View>

      {/* Custom slider */}
      <View
        style={{ height: THUMB_SIZE, justifyContent: "center" }}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 8, borderRadius: 4 }}
        />
        <View
          style={{
            position: "absolute",
            left: thumbLeft,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: currentColor,
            borderWidth: 2,
            borderColor: "white",
          }}
        />
      </View>

      {/* Number pills */}
      <View className="flex-row justify-between px-1">
        {numbers.map((num) => {
          const numColor = getColor(num, min, max);
          const isActive = numValue === num;
          return (
            <Pressable
              key={num}
              onPress={() => onChange(num.toString())}
              className="w-6 h-6 rounded-full items-center justify-center"
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
