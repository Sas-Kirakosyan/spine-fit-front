import { View, Text, Pressable } from "react-native";

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
  return (
    <View className="flex-row items-start justify-between mt-5 px-2.5">
      <View>
        <Text className="text-white text-3xl font-semibold">Personalizing your plan</Text>
        {!isInfoScreen && (
          <Text className="mt-1 text-lg text-white/80">
            Question {currentQuestionNumber} / {totalQuestions}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onClose}
        className="items-center rounded-[14px] bg-white/10 px-4 py-2"
      >
        <Text className="text-lg font-medium text-white">Home</Text>
      </Pressable>
    </View>
  );
}
