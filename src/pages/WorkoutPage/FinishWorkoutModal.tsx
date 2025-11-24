import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/Buttons/Button";
import type { Exercise } from "../../types/exercise";

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  completedExercises: Exercise[];
  duration: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function FinishWorkoutModal({
  isOpen,
  onClose,
  onLogWorkout,
  completedExercises,
  duration,
  containerRef,
}: FinishWorkoutModalProps) {
  const [syncToHealthConnect, setSyncToHealthConnect] = useState(false);

  if (!isOpen) return null;

  const volume = completedExercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.weight * exercise.reps * exercise.sets;
    return total + exerciseVolume;
  }, 0);

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
        <div className="bg-[#0E1224] border-t border-pink-500/30 rounded-t-[30px] shadow-2xl">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-pink-500/50" />
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

            <div className="flex items-center justify-between rounded-[10px] bg-[#13172A] p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="9" r="6" />
                  <circle cx="15" cy="15" r="6" />
                  <path d="M12 12l0 0" />
                  <path d="M9 9l6 6" />
                </svg>
                <span className="text-sm font-medium text-white">
                  Sync to Health Connect
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSyncToHealthConnect(!syncToHealthConnect)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  syncToHealthConnect ? "bg-blue-500" : "bg-slate-600"
                }`}
                aria-label="Toggle sync to Health Connect"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    syncToHealthConnect ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
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
                className="flex-1 h-[48px] rounded-[10px] bg-pink-500 text-white font-semibold uppercase tracking-[0.1em] hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30"
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
