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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-base text-gray-900 ${
            error ? "border-red-500" : isFocused ? "border-main" : "border-gray-300"
          }`}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-0 bottom-0 justify-center"
        >
          {showPassword ? (
            <EyeOffIcon size={20} color="#9ca3af" />
          ) : (
            <EyeIcon size={20} color="#9ca3af" />
          )}
        </Pressable>
      </View>
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
