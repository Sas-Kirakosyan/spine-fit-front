import { View, Text } from "react-native";

interface FormHeaderProps {
  title: string;
  subtitle?: string;
}

export function FormHeader({ title, subtitle }: FormHeaderProps) {
  return (
    <View className="items-center">
      <Text className="text-2xl font-bold text-main">{title}</Text>
      {subtitle && (
        <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>
      )}
    </View>
  );
}
