import { Button } from "@/components/Buttons/Button";

interface QuizHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  onClose: () => void;
}

export function QuizHeader({
  currentQuestion,
  totalQuestions,
  onClose,
}: QuizHeaderProps) {
  return (
    <div className="flex items-start justify-between mt-5 text-white">
      <div>
        <h2 className="text-2xl font-semibold">Personalizing your plan</h2>
        <p className="mt-1 text-sm text-white/80">
          Question {currentQuestion + 1} / {totalQuestions}
        </p>
      </div>
      <Button
        onClick={onClose}
        className="flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
      >
        Home
      </Button>
    </div>
  );
}
