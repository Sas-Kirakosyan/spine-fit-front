import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

interface ExerciseActionBarProps {
  selectedCount: number;
  onGroupAs?: () => void;
  onAddExercises: () => void;
}

function ExerciseActionBar({
  selectedCount,
  onGroupAs,
  onAddExercises,
}: ExerciseActionBarProps) {
  const { t } = useTranslation();
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pb-6 flex w-full max-w-[400px] px-5 gap-3 safe-area-bottom">
      {onGroupAs && (
        <Button
          onClick={onGroupAs}
          className="flex-1 px-4 py-3 rounded-[10px] bg-[#1B1E2B] text-white font-medium"
        >
          {t("allExercisePage.actionBar.groupAs")}
        </Button>
      )}
      <Button
        onClick={onAddExercises}
        className="flex-1 px-4 py-3 rounded-[10px] bg-main text-white font-medium"
      >
        {t(
          selectedCount === 1
            ? "allExercisePage.actionBar.addSingleExercise"
            : "allExercisePage.actionBar.addMultipleExercises",
          { count: selectedCount },
        )}
      </Button>
    </div>
  );
}

export default memo(ExerciseActionBar);
