import { useRef, useState } from "react";
import exerciseData from "@/MockData/exercise.json";
import type { Exercise } from "@/types/exercise";
import { PageContainer } from "@/Layout/PageContainer";
import type { WorkoutPageProps } from "@/types/workout";
import { ExerciseActionSheet } from "@/pages/WorkoutPage/ExercisePopUp";
import { Button } from "@/components/Buttons/Button";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import { BottomNav } from "@/components/BottomNav/BottomNav";

const defaultExercises: Exercise[] = exerciseData as Exercise[];

export function WorkoutPage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  activePage,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
  onNavigateToAllExercise,
  onNavigateToMyPlan,
  exercises = defaultExercises,
  onRemoveExercise,
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageContainer contentClassName="gap-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[32px] font-semibold uppercase tracking-[0.4em] text-white">
            SpineFit
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Workout</h1>
        </div>
      </header>
      <div ref={cardRef} className="relative flex flex-1 flex-col gap-8">
        <button
          onClick={() => {
            if (onNavigateToMyPlan) {
              onNavigateToMyPlan();
            }
          }}
        >
          <div className="flex">
            <div className="w-8 h-8 border-3 border-main rounded-full mr-1"></div>
            <div className="text-2xl font-semibold text-white">My Plan</div>
            <svg
              className="text-main"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </button>

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

          <div
            className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (onNavigateToAllExercise) {
                onNavigateToAllExercise();
              }
            }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[10px] border-2 border-stone-500 bg-transparent">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <span className="text-lg font-semibold text-red-500 sm:text-xl">
                Add Exercise
              </span>
            </div>
          </div>
        </section>

        <Button
          onClick={onStartWorkoutSession}
          className="mr-[20px] ml-[20px] h-[40px] rounded-[10px] bg-main text-white uppercase"
        >
          START Workout
        </Button>

        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
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
            onDelete={() => {
              if (actionExercise && onRemoveExercise) {
                onRemoveExercise(actionExercise.id);
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
