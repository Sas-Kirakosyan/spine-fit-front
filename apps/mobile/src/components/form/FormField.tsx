import { useState } from "react";
import { View, Text, TextInput } from "react-native";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full rounded-lg border px-3 py-2 text-base text-gray-900 ${
          error ? "border-red-500" : isFocused ? "border-main" : "border-gray-300"
        }`}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
