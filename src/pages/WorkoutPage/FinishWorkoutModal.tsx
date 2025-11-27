import { createPortal } from "react-dom";
import { Button } from "../../components/Buttons/Button";
import type { Exercise } from "../../types/exercise";
import type { ExerciseSetRow } from "../../types/workout";
import { calculateWorkoutVolume } from "../../utils/workoutStats";

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  completedExercises: Exercise[];
  duration: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  completedExerciseLogs?: Record<number, ExerciseSetRow[]>;
}

export function FinishWorkoutModal({
  isOpen,
  onClose,
  onLogWorkout,
  completedExercises,
  duration,
  containerRef,
  completedExerciseLogs = {},
}: FinishWorkoutModalProps) {
  if (!isOpen) return null;

  const volume = calculateWorkoutVolume(
    completedExercises,
    completedExerciseLogs
  );

  const calories = 100;

  const exerciseCount = completedExercises.length;

  const sheetContent = (
    <div className="absolute h-full w-full inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close finish workout modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full">
        <div className="bg-[#0E1224] border-t border-slate-700 rounded-t-[30px]">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-6 px-6 pb-8 pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                Finish and log your workout?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  VOLUME
                </p>
                <p className="text-lg font-semibold text-white">
                  {volume.toLocaleString()} kg
                </p>
              </div>
              <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  CALORIES
                </p>
                <p className="text-lg font-semibold text-white">
                  {calories} kcal
                </p>
              </div>
              <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  EXERCISES
                </p>
                <p className="text-lg font-semibold text-white">
                  {exerciseCount}
                </p>
              </div>
              <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  DURATION
                </p>
                <p className="text-lg font-semibold text-white">{duration}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                className="flex-1 h-[48px] rounded-[10px] bg-[#1A1F35] text-white font-semibold uppercase tracking-[0.1em] hover:bg-[#242940] transition-colors"
              >
                Resume
              </Button>
              <Button
                onClick={onLogWorkout}
                className="flex-1 h-[48px] rounded-[10px] bg-blue-600 text-white font-semibold uppercase tracking-[0.1em]"
              >
                Log Workout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, containerRef.current ?? document.body);
}
