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
      <div className="mt-6 mb-26 mx-4 text-white">
        <div className="mb-5">
          <button
            onClick={onNext}
            className="w-full rounded-full bg-main py-4 text-base font-semibold text-white transition hover:bg-main/90"
          >
            {t("quiz.nav.startAssessment")}
          </button>
          <p className="mt-2 text-center text-sm text-white/50">{t("quiz.nav.takesLessThan")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 mx-4 text-white">
      <div className="w-full flex justify-between mb-5 gap-3">
        {currentQuestion > 0 && (
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 px-8 py-4 text-base font-medium transition hover:bg-white/20"
          >
            {t("quiz.nav.back")}
          </button>
        )}
        {!hideNextButton && !isLastQuestion ? (
          <button
            onClick={onNext}
            disabled={!isAnswered}
            className={`rounded-full px-8 py-4 text-base font-semibold transition ${
              isAnswered
                ? "bg-main text-white hover:bg-main/90"
                : "bg-white/10 text-white/60 cursor-not-allowed"
            }`}
          >
            {t("quiz.nav.next")}
          </button>
        ) : !hideNextButton && isLastQuestion ? (
          <button
            onClick={onSubmit}
            disabled={!isAnswered}
            className={`rounded-full px-8 py-4 text-base font-semibold transition ${
              isAnswered
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-white/10 text-white/60 cursor-not-allowed"
            }`}
          >
            {t("quiz.nav.finish")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
