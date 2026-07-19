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
    <View className="my-2 items-center justify-center">
      <View className="absolute left-0 right-0 h-px bg-gray-200" />
      <Text className="bg-white px-2 text-sm text-gray-900">{label}</Text>
    </View>
  );
}
