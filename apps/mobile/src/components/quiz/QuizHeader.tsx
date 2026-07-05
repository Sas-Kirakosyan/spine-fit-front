import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface QuizHeaderProps {
  currentQuestionNumber: number;
  totalQuestions: number;
  isInfoScreen: boolean;
  onClose: () => void;
}

export function QuizHeader({
  currentQuestionNumber,
  totalQuestions,
  isInfoScreen,
  onClose,
}: QuizHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-start justify-between mt-5 px-2.5">
      <View className="flex-1 pr-3">
        <Text className="text-white text-3xl font-semibold">
          {t("quiz.header.title")}
        </Text>
        {!isInfoScreen && (
          <Text className="mt-1 text-lg text-white/80">
            {t("quiz.header.questionCount", {
              current: currentQuestionNumber,
              total: totalQuestions,
            })}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onClose}
        accessibilityLabel={t("quiz.header.homeAriaLabel")}
        className="items-center rounded-[14px] bg-white/10 px-4 py-2"
      >
        <Text className="text-lg font-medium text-white">
          {t("homePage.home", { defaultValue: "Home" })}
        </Text>
      </Pressable>
    </View>
  );
}
