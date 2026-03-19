import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { EyeIcon, EyeOffIcon } from "../icons/Icons";

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
}

export function PasswordInput({
  label,
  value,
  onChangeText,
  error,
  placeholder,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          className={`w-full rounded-lg border px-4 py-3 pr-12 text-base text-gray-900 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
        >
          {showPassword ? (
            <EyeOffIcon size={20} color="#6b7280" />
          ) : (
            <EyeIcon size={20} color="#6b7280" />
          )}
        </Pressable>
      </View>
      {error && <Text className="text-sm text-red-500">{error}</Text>}
    </View>
  );
}
