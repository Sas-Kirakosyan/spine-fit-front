import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

const logoSource = require("../../../../../packages/shared/public/logo/logo.png");

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
    <View className="flex-row items-start gap-1 mt-5 px-2.5">
      <Pressable
        onPress={onClose}
        accessibilityLabel={t("quiz.header.homeAriaLabel")}
      >
        <Image
          source={logoSource}
          style={{ width: 88, height: 88 }}
          contentFit="contain"
        />
      </Pressable>
      <View>
        <Text className="text-white text-2xl font-semibold">
          {t("quiz.header.title")}
        </Text>
        {!isInfoScreen && (
          <Text className="mt-1 text-sm text-white/80">
            {t("quiz.header.questionCount", {
              current: currentQuestionNumber,
              total: totalQuestions,
            })}
          </Text>
        )}
      </View>
    </View>
  );
}
