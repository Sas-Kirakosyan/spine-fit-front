import { useCallback, useState } from "react";
import allExercisesData from "@/MockData/allExercise.json";
import type { Exercise } from "@/types/exercise";
import { PageContainer } from "@/Layout/PageContainer";
import { useExerciseGrouping } from "./useExerciseGrouping";
import { useExerciseSelection } from "./useExerciseSelection";
import { AllExercisePageHeader } from "@/components/AllExercise/AllExercisePageHeader";
import { ExerciseSearchBar } from "@/components/AllExercise/ExerciseSearchBar";
import {
  ExerciseTabs,
  type TabType,
} from "@/components/AllExercise/ExerciseTabs";
import { ExerciseGroup } from "@/components/AllExercise/ExerciseGroup";
import ExerciseActionBar from "@/components/AllExercise/ExerciseActionBar";

interface AllExercisePageProps {
  onClose: () => void;
  onAddExercises?: (exercises: Exercise[]) => void;
}

export function AllExercisePage({
  onClose,
  onAddExercises,
}: AllExercisePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const exercises: Exercise[] = allExercisesData as Exercise[];

  const groupedExercises = useExerciseGrouping(exercises, searchQuery);

  const {
    selectedExercises,
    toggleExercise,
    clearSelection,
    getSelectedExercises,
    selectedCount,
  } = useExerciseSelection();

  const handleExerciseClick = useCallback(
    (exercise: Exercise) => {
      toggleExercise(exercise.id);
    },
    [toggleExercise]
  );

  const handleAddExercises = useCallback(() => {
    const exercisesToAdd = getSelectedExercises(exercises);
    if (onAddExercises && exercisesToAdd.length > 0) {
      onAddExercises(exercisesToAdd);
      clearSelection();
      onClose();
    }
  }, [
    getSelectedExercises,
    onAddExercises,
    exercises,
    clearSelection,
    onClose,
  ]);

  return (
    <PageContainer contentClassName="px-4 py-6 relative">
      <div className="flex flex-col h-full relative">
        <AllExercisePageHeader
          onClose={onClose}
          onToggleSearch={() => setShowSearch(!showSearch)}
        />

        {showSearch && (
          <ExerciseSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        <ExerciseTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          className={`flex-1 overflow-y-auto ${
            selectedCount > 0 ? "pb-24" : ""
          }`}
        >
          {Object.keys(groupedExercises).length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No exercises found
            </div>
          ) : (
            Object.entries(groupedExercises).map(
              ([groupKey, groupExercises]) => (
                <ExerciseGroup
                  key={groupKey}
                  groupKey={groupKey}
                  exercises={groupExercises}
                  selectedExerciseIds={selectedExercises}
                  onExerciseSelect={handleExerciseClick}
                />
              )
            )
          )}
        </div>

        <ExerciseActionBar
          selectedCount={selectedCount}
          onAddExercises={handleAddExercises}
        />
      </div>
    </PageContainer>
  );
}
