interface QuizNavigationButtonsProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  isOptional: boolean;
  isInfoScreen: boolean;
  buttonText?: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}

export function QuizNavigationButtons({
  currentQuestion,
  totalQuestions,
  isAnswered,
  isOptional,
  isInfoScreen,
  buttonText,
  onBack,
  onNext,
  onSkip,
  onSubmit,
}: QuizNavigationButtonsProps) {
  const isLastQuestion = currentQuestion >= totalQuestions - 1;

  return (
    <div className="mt-6 flex items-center justify-between text-white">
      {isOptional ? (
        <button
          onClick={onSkip}
          className="rounded-full mb-5 bg-white/10 px-6 py-2 text-sm font-medium transition hover:bg-white/20"
        >
          Skip
        </button>
      ) : (
        <span />
      )}
      <div className="flex mb-5 gap-3">
        {currentQuestion > 0 && (
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            Back
          </button>
        )}
        {!isLastQuestion ? (
          <button
            onClick={onNext}
            disabled={!isAnswered}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              isAnswered
                ? "bg-main text-white hover:bg-main/90"
                : "bg-white/10 text-white/60 cursor-not-allowed"
            }`}
          >
            {isInfoScreen ? buttonText || "Next" : "Next"}
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!isAnswered}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              isAnswered
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-white/10 text-white/60 cursor-not-allowed"
            }`}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
