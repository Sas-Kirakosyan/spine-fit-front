import { memo } from "react";
import type { Exercise } from "@/types/exercise";
import { ExerciseItem } from "@/components/AllExercise/ExerciseItem";

interface ExerciseGroupProps {
  groupKey: string;
  exercises: Exercise[];
  selectedExerciseIds: Set<number>;
  onExerciseSelect: (exercise: Exercise) => void;
}

export function ExerciseGroup({
  groupKey,
  exercises,
  selectedExerciseIds,
  onExerciseSelect,
}: ExerciseGroupProps) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">{groupKey}</h2>
      </div>

      <div className="space-y-2">
        {exercises.map((exercise) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            isSelected={selectedExerciseIds.has(exercise.id)}
            onSelect={onExerciseSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ExerciseGroup);
