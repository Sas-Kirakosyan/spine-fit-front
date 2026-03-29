import { View, Text, Pressable } from "react-native";

interface QuizNavigationButtonsProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  isInfoScreen: boolean;
  hideNextButton?: boolean;
  buttonText?: string;
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
  buttonText,
  onBack,
  onNext,
  onSubmit,
}: QuizNavigationButtonsProps) {
  const isLastQuestion = currentQuestion >= totalQuestions - 1;
  const isStartScreen = currentQuestion === 0 && isInfoScreen;

  if (isStartScreen) {
    return (
      <View className="items-center pb-8">
        <Pressable
          onPress={onNext}
          className="w-full max-w-[300px] h-[60px] rounded-[18px] bg-main py-4 items-center"
        >
          <Text className="text-2xl font-semibold text-white">{buttonText}</Text>
        </Pressable>
        <Text className="mt-2 text-md text-white/50">Takes less than 1 minute</Text>
      </View>
    );
  }

  return (
    <View className="mt-6 mx-4 mb-5">
      <View className="w-full flex-row justify-between gap-3">
        {currentQuestion > 0 && (
          <Pressable
            onPress={onBack}
            className="rounded-[18px] bg-white/10 px-8 py-4"
          >
            <Text className="text-2xl font-medium text-white">Back</Text>
          </Pressable>
        )}
        {!hideNextButton && !isLastQuestion ? (
          <Pressable
            onPress={onNext}
            disabled={!isAnswered}
            className={`rounded-[18px] px-8 py-4 ${
              isAnswered ? "bg-main" : "bg-white/10"
            }`}
          >
            <Text
              className={`text-2xl font-semibold ${
                isAnswered ? "text-white" : "text-white/60"
              }`}
            >
              {isInfoScreen ? buttonText || "Next" : "Next"}
            </Text>
          </Pressable>
        ) : !hideNextButton && isLastQuestion ? (
          <Pressable
            onPress={onSubmit}
            disabled={!isAnswered}
            className={`rounded-[18px] px-8 py-4 ${
              isAnswered ? "bg-green-500" : "bg-white/10"
            }`}
          >
            <Text
              className={`text-2xl font-semibold ${
                isAnswered ? "text-white" : "text-white/60"
              }`}
            >
              Finish
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
