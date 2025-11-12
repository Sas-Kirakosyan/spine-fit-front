import { useRef, useState } from "react";
import exerciseData from "../../MockData/exercise.json";
import { PageContainer } from "../../Layout/PageContainer";
import type { Exercise } from "../../types/exercise";
import { ExerciseActionSheet } from "./ExerciseActionSheet";

interface WorkoutPageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  activePage: "workout" | "profile";
  onOpenExerciseDetails: (exercise: Exercise) => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
}

const exercises: Exercise[] = exerciseData as Exercise[];

const baseNavButtonClass =
  "flex flex-1 flex-col items-center py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors";

const getNavButtonClassName = (isActive: boolean) =>
  `${baseNavButtonClass} ${
    isActive
      ? "bg-blue-600 text-white"
      : "bg-[#1B1E2B] text-slate-200 hover:text-white"
  }`;

export function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProfile,
  activePage,
  onOpenExerciseDetails,
  onOpenExerciseSets,
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageContainer contentClassName="">
      <div ref={cardRef} className="relative flex flex-1 flex-col gap-8">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[32px] font-semibold uppercase tracking-[0.4em] text-white">
              SpineFit
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Exercise List
            </h1>
            <button type="button" onClick={onNavigateToHome}>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
                Back
              </span>
            </button>
          </div>
        </header>

        <section className="flex-1 space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={`${exercise.id}-${index}`}
              className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5"
              role="button"
              tabIndex={0}
              onClick={() => onOpenExerciseSets(exercise)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenExerciseSets(exercise);
                }
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenExerciseDetails(exercise);
                }}
                className="relative h-20 w-20 overflow-hidden rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label={`Открыть детали упражнения ${exercise.name}`}
              >
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
              </button>

              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold text-white sm:text-xl">
                    {exercise.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-200">
                  <span>{exercise.sets} Sets</span>
                  <span className="text-slate-500">•</span>
                  <span>{exercise.reps} Reps</span>
                  <span className="text-slate-500">•</span>
                  <span>
                    {exercise.weight} {exercise.weight_unit}
                  </span>
                </div>
              </div>

              <span
                className="ml-2 hidden cursor-pointer rounded-full p-1 transition hover:bg-slate-800/60 sm:inline-flex"
                role="button"
                tabIndex={0}
                aria-label="Открыть действия упражнения"
                onClick={(event) => {
                  event.stopPropagation();
                  setActionExercise(exercise);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    setActionExercise(exercise);
                  }
                }}
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-slate-100 transition hover:text-white"
                  viewBox="0 0 16 4"
                  fill="currentColor"
                >
                  <circle cx="2" cy="2" r="2" />
                  <circle cx="8" cy="2" r="2" />
                  <circle cx="14" cy="2" r="2" />
                </svg>
              </span>
            </div>
          ))}
        </section>

        <nav className="bg-[#1B1E2B] flex justify-evenly gap-4 rounded-[10px]">
          <button
            type="button"
            className={getNavButtonClassName(activePage === "workout")}
            onClick={onNavigateToWorkout}
          >
            Workout
          </button>
          <button
            type="button"
            className={getNavButtonClassName(activePage === "profile")}
            onClick={onNavigateToProfile}
          >
            Profile
          </button>
        </nav>

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
