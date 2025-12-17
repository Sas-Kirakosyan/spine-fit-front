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
  return (
    <div className="flex items-start justify-between mt-5 text-white">
      <div className="px-4">
        <h2 className="text-2xl font-semibold">Personalizing your plan</h2>
        {!isInfoScreen && (
          <p className="mt-1 text-sm text-white/80">
            Question {currentQuestionNumber} / {totalQuestions}
          </p>
        )}
      </div>
      <Button
        onClick={onClose}
        className="flex mr-4 items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
      >
        Home
      </Button>
    </div>
  );
}
