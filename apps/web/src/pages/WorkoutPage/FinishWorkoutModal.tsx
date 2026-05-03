import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { Sheet } from "@/components/ui/Modal";
import type { Exercise } from "@/types/exercise";
import type { ExerciseSetRow } from "@/types/workout";
import { calculateWorkoutVolume } from "@/utils/workoutStats";

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  completedExercises: Exercise[];
  duration: string;
  completedExerciseLogs?: Record<number, ExerciseSetRow[]>;
}

export function FinishWorkoutModal({
  isOpen,
  onClose,
  onLogWorkout,
  completedExercises,
  duration,
  completedExerciseLogs = {},
}: FinishWorkoutModalProps) {
  const { t } = useTranslation();

  const volume = calculateWorkoutVolume(
    completedExercises,
    completedExerciseLogs
  );

  const calories = 100;

  const exerciseCount = completedExercises.length;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      ariaLabel={t("finishWorkoutModal.title")}
      className="bg-[#0E1224]"
      bodyClassName="space-y-6 px-6 pb-8 pt-6 safe-area-bottom"
    >
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          {t("finishWorkoutModal.title")}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            {t("finishWorkoutModal.volume")}
          </p>
          <p className="text-lg font-semibold text-white">
            {volume.toLocaleString()} {t("finishWorkoutModal.volumeUnit")}
          </p>
        </div>
        <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            {t("finishWorkoutModal.calories")}
          </p>
          <p className="text-lg font-semibold text-white">
            {calories} {t("finishWorkoutModal.caloriesUnit")}
          </p>
        </div>
        <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            {t("finishWorkoutModal.exercises")}
          </p>
          <p className="text-lg font-semibold text-white">
            {exerciseCount}
          </p>
        </div>
        <div className="rounded-[10px] bg-[#13172A] p-4 border border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            {t("finishWorkoutModal.duration")}
          </p>
          <p className="text-lg font-semibold text-white">{duration}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={onClose}
          className="flex-1 h-[48px] rounded-[10px] bg-[#1A1F35] text-white font-semibold uppercase tracking-[0.1em] hover:bg-[#242940] transition-colors"
        >
          {t("finishWorkoutModal.resume")}
        </Button>
        <Button
          onClick={onLogWorkout}
          className="flex-1 h-[48px] rounded-[10px] bg-main text-white font-semibold uppercase tracking-[0.1em]"
        >
          {t("finishWorkoutModal.logWorkout")}
        </Button>
      </div>
    </Sheet>
  );
}
