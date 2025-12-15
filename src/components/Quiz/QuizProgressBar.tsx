interface QuizProgressBarProps {
  currentQuestion: number;
  currentQuestionNumber: number;
  totalQuestions: number;
  isInfoScreen: boolean;
}

export function QuizProgressBar({
  currentQuestion,
  currentQuestionNumber,
  totalQuestions,
  isInfoScreen,
}: QuizProgressBarProps) {
  const progressWidth = isInfoScreen
    ? 0
    : (currentQuestionNumber / totalQuestions) * 100;

  return (
    <div className="mb-6">
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-main transition-all duration-300"
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>
    </div>
  );
}
