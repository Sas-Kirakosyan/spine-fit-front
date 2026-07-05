import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface QuizNavigationButtonsProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  isInfoScreen: boolean;
  hideNextButton?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function QuizNavigationButtons({
  currentQuestion,
  totalQuestions,
  isAnswered,
  isInfoScreen,
  hideNextButton = false,
  onBack,
  onNext,
  onSubmit,
}: QuizNavigationButtonsProps) {
  const { t } = useTranslation();
  const isLastQuestion = currentQuestion >= totalQuestions - 1;
  const isStartScreen = currentQuestion === 0 && isInfoScreen;

  if (isStartScreen) {
    return (
      <View className="items-center pb-8 mx-4">
        <Pressable
          onPress={onNext}
          className="w-full rounded-full bg-main py-4 items-center"
        >
          <Text className="text-base font-semibold text-white">
            {t("quiz.nav.startAssessment")}
          </Text>
        </Pressable>
        <Text className="mt-2 text-sm text-white/50">
          {t("quiz.nav.takesLessThan")}
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-6 mx-4 mb-5">
      <View className="w-full flex-row justify-between gap-3">
        {currentQuestion > 0 && (
          <Pressable
            onPress={onBack}
            className="rounded-full bg-white/10 px-8 py-4"
          >
            <Text className="text-base font-medium text-white">
              {t("quiz.nav.back")}
            </Text>
          </Pressable>
        )}
        {!hideNextButton && !isLastQuestion ? (
          <Pressable
            onPress={onNext}
            disabled={!isAnswered}
            className={`rounded-full px-8 py-4 ${
              isAnswered ? "bg-main" : "bg-white/10"
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isAnswered ? "text-white" : "text-white/60"
              }`}
            >
              {t("quiz.nav.next")}
            </Text>
          </Pressable>
        ) : !hideNextButton && isLastQuestion ? (
          <Pressable
            onPress={onSubmit}
            disabled={!isAnswered}
            className={`rounded-full px-8 py-4 ${
              isAnswered ? "bg-main" : "bg-white/10"
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isAnswered ? "text-white" : "text-white/60"
              }`}
            >
              {t("quiz.nav.generate")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
