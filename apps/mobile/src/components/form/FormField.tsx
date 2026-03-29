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
  return (
    <View className="gap-2">
      <Text
        className="text-[11px] font-semibold uppercase text-gray-700"
        style={{ letterSpacing: 2.52 }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.25)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={`w-full h-12 rounded-[18px] border px-5 text-base text-gray-900 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
