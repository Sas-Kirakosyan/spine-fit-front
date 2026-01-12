interface QuizNavigationButtonsProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  isOptional: boolean;
  isInfoScreen: boolean;
  hideNextButton?: boolean;
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
  hideNextButton = false,
  buttonText,
  onBack,
  onNext,
  onSkip,
  onSubmit,
}: QuizNavigationButtonsProps) {
  const isLastQuestion = currentQuestion >= totalQuestions - 1;
  const isStartScreen =
    currentQuestion === 0 && isInfoScreen && buttonText === "Start";

  if (isStartScreen) {
    return (
      <div className="flex flex-col items-center text-white absolute bottom-50 left-0 right-0">
        <button
          onClick={onNext}
          className="w-full max-w-[300px] mx-auto rounded-[18px] bg-main py-4 text-lg font-semibold text-white transition hover:bg-main/90"
        >
          {buttonText}
        </button>
        <p className="mt-2 text-sm text-gray-400">Takes less than 1 minute</p>
      </div>
    );
  }

  return (
    <div className="mt-6 mx-4 flex items-center justify-between text-white">
      {isOptional ? (
        <button
          onClick={onSkip}
          className="rounded-full mb-5 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-6"
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
        {!hideNextButton && !isLastQuestion ? (
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
        ) : !hideNextButton && isLastQuestion ? (
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
        ) : null}
      </div>
    </div>
  );
}
