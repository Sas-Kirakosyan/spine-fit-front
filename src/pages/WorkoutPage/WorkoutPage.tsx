import { useRef, useState } from "react";
import exerciseData from "../../MockData/exercise.json";
import { PageContainer } from "../../layout/PageContainer";
import type { Exercise } from "../../types/exercise";
import type { WorkoutPageProps } from "../../types/workout";
import { ExerciseActionSheet } from "./ExerciseActionSheet";
import { Button } from "../../components/Buttons/Button";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ExerciseCard } from "../../components/ExerciseCard/ExerciseCard";
import { BottomNav } from "../../components/BottomNav/BottomNav";

const exercises: Exercise[] = exerciseData as Exercise[];

export function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProfile,
  activePage,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageContainer contentClassName="">
      <div ref={cardRef} className="relative flex flex-1 flex-col gap-8">
        <PageHeader
          title="Exercise List"
          showBackButton
          onBack={onNavigateToHome}
        />

        <section className="flex-1 space-y-3">
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={`${exercise.id}-${index}`}
              exercise={exercise}
              onCardClick={() => onOpenExerciseSets(exercise)}
              onDetailsClick={() => onOpenExerciseDetails(exercise)}
              onActionClick={() => setActionExercise(exercise)}
            />
          ))}
        </section>

        <Button
          onClick={onStartWorkoutSession}
          className="mr-[20px] ml-[20px] h-[40px] rounded-[10px] bg-blue-600 text-white uppercase"
        >
          START Workout
        </Button>

        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
        />

        {actionExercise && (
          <ExerciseActionSheet
            exercise={actionExercise}
            onClose={() => setActionExercise(null)}
            onShowDetails={() => {
              if (actionExercise) {
                onOpenExerciseDetails(actionExercise);
              }
              setActionExercise(null);
            }}
            onStartWorkout={() => {
              if (actionExercise) {
                onOpenExerciseSets(actionExercise);
              }
              setActionExercise(null);
            }}
            containerRef={cardRef}
          />
        )}
      </div>
    </PageContainer>
  );
}
