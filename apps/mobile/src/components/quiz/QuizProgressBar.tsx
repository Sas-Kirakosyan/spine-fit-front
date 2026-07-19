import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

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
  const animatedWidth = useRef(new Animated.Value(progressWidth)).current;

  // Mirrors the web bar's `transition-all duration-300`
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressWidth, animatedWidth]);

  return (
    <View className="mb-6">
      <View className="h-2 w-full rounded-full bg-gray-200">
        <Animated.View
          className="h-2 rounded-full bg-main"
          style={{
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
}
