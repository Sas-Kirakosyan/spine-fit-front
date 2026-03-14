import { View, TextInput, Pressable, Text } from "react-native";
import { useState } from "react";

interface QuizInputWithUnitProps {
  value: string;
  unit: string;
  unitOptions: string[];
  placeholder: string;
  inputType?: "number" | "text";
  onChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
}

export function QuizInputWithUnit({
  value,
  unit,
  unitOptions,
  placeholder,
  inputType = "text",
  onChange,
  onUnitChange,
}: QuizInputWithUnitProps) {
  return (
    <View className="flex-row gap-3 w-full">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={inputType === "number" ? "numeric" : "default"}
        className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900"
      />
      <View className="flex-row rounded-lg border-2 border-gray-300 overflow-hidden">
        {unitOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => onUnitChange(option)}
            className={`px-4 py-3 ${unit === option ? "bg-main" : "bg-white"}`}
          >
            <Text className={`text-lg font-medium ${unit === option ? "text-white" : "text-gray-700"}`}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
