import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useExerciseName } from "@spinefit/shared";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
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
import { FilterChips } from "@/components/AllExercise/FilterChips";

interface AllExercisePageProps {
  onClose: () => void;
  onAddExercises?: (exercises: Exercise[]) => void;
}

function AllExercisePage({ onClose, onAddExercises }: AllExercisePageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { getExerciseName } = useExerciseName();
  const exercises: Exercise[] = allExercisesData as Exercise[];

  const allMuscles = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => (e.muscle_groups ?? []).forEach((m) => set.add(m)));
    return [...set].sort();
  }, [exercises]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => { if (e.category) set.add(e.category); });
    return [...set].sort();
  }, [exercises]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedMuscle(null);
    setSelectedCategory(null);
  }, []);

  const groupedExercises = useExerciseGrouping(
    exercises,
    searchQuery,
    getExerciseName,
    activeTab === "muscle" ? selectedMuscle : null,
    activeTab === "categories" ? selectedCategory : null,
  );

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
    [toggleExercise],
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

        <ExerciseTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === "muscle" && (
          <FilterChips
            options={allMuscles}
            selected={selectedMuscle}
            onSelect={setSelectedMuscle}
          />
        )}

        {activeTab === "categories" && (
          <FilterChips
            options={allCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        <div
          className={`flex-1 overflow-y-auto ${
            selectedCount > 0 ? "pb-24" : ""
          }`}
        >
          {Object.keys(groupedExercises).length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {t("allExercisePage.noExercisesFound")}
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
              ),
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

export default AllExercisePage;
