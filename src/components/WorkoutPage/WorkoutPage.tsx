import { useState } from "react";
import exerciseData from "../../MockData/exercise.json";
import { PageContainer } from "../../Layout/PageContainer";
import type { Exercise } from "../../types/exercise";
import { ExerciseDetails } from "./ExerciseDetails";

interface WorkoutPageProps {
  onNavigateToHome: () => void;
}

const exercises: Exercise[] = exerciseData as Exercise[];

export function WorkoutPage({ onNavigateToHome }: WorkoutPageProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  return (
    <PageContainer contentClassName="gap-8">
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
          <button
            key={`${exercise.id}-${index}`}
            type="button"
            onClick={() => setSelectedExercise(exercise)}
            className="group flex w-full items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 text-left shadow-xl ring-1 ring-white/5 p-3"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-[14px]">
              <img
                src={exercise.image_url}
                alt={exercise.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 rounded-3xl border border-white/10" />
            </div>

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

            <span className="ml-2 hidden text-slate-100 sm:block">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 4 16"
                fill="currentColor"
              >
                <circle cx="2" cy="2" r="2" />
                <circle cx="2" cy="8" r="2" />
                <circle cx="2" cy="14" r="2" />
              </svg>
            </span>
          </button>
        ))}
      </section>

      {selectedExercise && (
        <ExerciseDetails
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </PageContainer>
  );
}
