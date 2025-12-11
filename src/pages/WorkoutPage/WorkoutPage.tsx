import { useRef, useState } from "react";
import exerciseData from "@/MockData/exercise.json";
import type { Exercise } from "@/types/exercise";
import { PageContainer } from "@/Layout/PageContainer";
import type { WorkoutPageProps } from "@/types/workout";
import { ExerciseActionSheet } from "@/pages/WorkoutPage/ExercisePopUp";
import { Button } from "@/components/Buttons/Button";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { WorkoutPageHeader } from "./WorkoutPageHeader";

const defaultExercises: Exercise[] = exerciseData as Exercise[];

export function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  activePage,
  onNavigateToMyPlan,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
  onNavigateToAllExercise,
  exercises = defaultExercises,
  onRemoveExercise,
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <Logo />
        {onNavigateToHome && (
          <Button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Back to Home
          </Button>
        )}
      </div>
      <div ref={cardRef} className="flex flex-col gap-3 pb-[140px]">
        <WorkoutPageHeader
          onNavigateToMyPlan={() => {
            if (onNavigateToMyPlan) {
              onNavigateToMyPlan();
            }
          }}
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
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[400px]">
        <Button
          onClick={onStartWorkoutSession}
          className="w-[360px] mr-[20px] ml-[20px] mb-[30px] h-[40px] rounded-[10px] bg-main text-white uppercase"
        >
          START Workout
        </Button>
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
        />
      </div>

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
    </PageContainer>
  );
}
