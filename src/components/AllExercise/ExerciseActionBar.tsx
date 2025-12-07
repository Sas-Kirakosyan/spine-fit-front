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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1117] border-t border-white/10 pt-4 pb-6 px-4 flex gap-3 shadow-lg w-[90%] mx-auto">
      {onGroupAs && (
        <Button
          onClick={onGroupAs}
          className="flex-1 px-4 py-3 rounded-[10px] bg-[#1B1E2B] text-white font-medium hover:bg-[#1B1E2B]/80 transition-colors"
        >
          Group as...
        </Button>
      )}
      <Button
        onClick={onAddExercises}
        className="flex-1 px-4 py-3 rounded-[10px] bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
      >
        Add {selectedCount} {selectedCount === 1 ? "Exercise" : "Exercises"}
      </Button>
    </div>
  );
}

export default memo(ExerciseActionBar);
