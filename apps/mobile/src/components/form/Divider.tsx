import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface DividerProps {
  text?: string;
}

export function Divider({ text }: DividerProps) {
  const { t } = useTranslation();
  const label =
    text ?? t("common.orContinueWith", { defaultValue: "Or continue with" });

  return (
    <View className="flex-row items-center gap-3 my-2">
      <View className="flex-1 h-px bg-gray-200" />
      <Text className="text-sm text-gray-500">{label}</Text>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );
}
