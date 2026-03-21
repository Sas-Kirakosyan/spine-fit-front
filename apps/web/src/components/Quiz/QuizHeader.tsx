import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

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
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between mt-5 text-white">
      <div className="px-2.5">
        <h2 className="text-2xl font-semibold">{t("quiz.header.title")}</h2>
        {!isInfoScreen && (
          <p className="mt-1 text-sm text-white/80">
            {t("quiz.header.questionCount", { current: currentQuestionNumber, total: totalQuestions })}
          </p>
        )}
      </div>
      <Button
        onClick={onClose}
        className="flex mx-2.5 items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
      >
        {t("quiz.header.home")}
      </Button>
    </div>
  );
}
