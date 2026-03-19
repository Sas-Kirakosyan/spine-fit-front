import { View } from "react-native";

interface QuizProgressBarProps {
  currentQuestionNumber: number;
  totalQuestions: number;
  isInfoScreen: boolean;
}

export function QuizProgressBar({
  currentQuestionNumber,
  totalQuestions,
  isInfoScreen,
}: QuizProgressBarProps) {
  const progressWidth = isInfoScreen ? 0 : (currentQuestionNumber / totalQuestions) * 100;

  return (
    <View className="mb-6">
      <View className="h-2 w-full rounded-full bg-gray-200">
        <View
          className="h-2 rounded-full bg-main"
          style={{ width: `${progressWidth}%` }}
        />
      </View>
    </View>
  );
}
