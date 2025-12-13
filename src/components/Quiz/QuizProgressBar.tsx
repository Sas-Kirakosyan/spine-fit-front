interface QuizProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function QuizProgressBar({
  currentQuestion,
  totalQuestions,
}: QuizProgressBarProps) {
  return (
    <div className="mb-6">
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-main transition-all duration-300"
          style={{
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
