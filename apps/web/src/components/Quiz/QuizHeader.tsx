import { useTranslation } from "react-i18next";
import { HomeIcon } from "@/components/Icons/Icons.tsx";

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
    <div className="flex items-start gap-1 mt-5 px-2.5 text-white">
      <HomeIcon
        onClickHomeIcon={onClose}
        ariaLabel={t("quiz.header.homeAriaLabel")}
        className="h-22 w-22 object-contain shrink-0"
      />
      <div>
        <h2 className="text-2xl font-semibold">{t("quiz.header.title")}</h2>
        {!isInfoScreen && (
          <p className="mt-1 text-sm text-white/80">
            {t("quiz.header.questionCount", {
              current: currentQuestionNumber,
              total: totalQuestions,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
