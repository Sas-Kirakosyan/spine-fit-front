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
    <View className="gap-2">
      <Text
        className="text-[11px] font-semibold uppercase text-gray-700"
        style={{ letterSpacing: 2.52 }}
      >
        {label}
      </Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.25)"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          className={`w-full h-12 rounded-[18px] border px-5 pr-12 text-base text-gray-900 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-0 bottom-0 justify-center"
        >
          {showPassword ? (
            <EyeOffIcon size={20} color="#6b7280" />
          ) : (
            <EyeIcon size={20} color="#6b7280" />
          )}
        </Pressable>
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
