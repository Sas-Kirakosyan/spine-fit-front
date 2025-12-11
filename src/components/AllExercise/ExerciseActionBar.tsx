import { memo } from "react";
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
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pb-6 flex">
      {onGroupAs && (
        <Button
          onClick={onGroupAs}
          className="flex-1 px-4 py-3 rounded-[10px] bg-[#1B1E2B] text-white font-medium"
        >
          Group as...
        </Button>
      )}
      <Button
        onClick={onAddExercises}
        className="flex-1 px-4 py-3 w-[360px] rounded-[10px] bg-red-500 text-white font-medium"
      >
        Add {selectedCount} {selectedCount === 1 ? "Exercise" : "Exercises"}
      </Button>
    </div>
  );
}

export default memo(ExerciseActionBar);
