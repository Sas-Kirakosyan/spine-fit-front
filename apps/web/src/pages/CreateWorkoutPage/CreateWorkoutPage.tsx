import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/utils/analytics";
import { PageContainer } from "@/Layout/PageContainer";
import { type Exercise } from "@/types/exercise";
import { useExerciseName } from "@spinefit/shared";
import { getExerciseImageUrl } from "@/utils/exercise";
import type { SavedProgram, TrainingDay } from "@/types/workout";
import { LazyImage } from "@/components/ui/LazyImage";

interface CreateProgramPageProps {
  days: TrainingDay[];
  onNavigateBack: () => void;
  onAddExercise: (dayId: string) => void;
  onSave: () => void;
  onDaysChange: (days: TrainingDay[]) => void;
  onProgramNameChange: (name: string) => void;
  programName: string;
  editProgramId?: string;
}

function loadSavedPrograms(): SavedProgram[] {
  try {
    const data = localStorage.getItem("savedPrograms");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistSavedPrograms(programs: SavedProgram[]) {
  localStorage.setItem("savedPrograms", JSON.stringify(programs));
}

export default function CreateProgramPage({
  days,
  onNavigateBack,
  onAddExercise,
  onSave,
  onDaysChange,
  onProgramNameChange,
  programName,
  editProgramId,
}: CreateProgramPageProps) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(
    days.length > 0 ? days[0].id : null
  );
  const isEditing = Boolean(editProgramId);

  const handleAddDay = useCallback(() => {
    const newDay: TrainingDay = {
      id: `day-${Date.now()}`,
      name: t("createProgramPage.newDayName", { number: days.length + 1 }),
      exercises: [],
    };
    const updated = [...days, newDay];
    onDaysChange(updated);
    setExpandedDayId(newDay.id);
  }, [days, onDaysChange, t]);

  const handleRemoveDay = useCallback(
    (dayId: string) => {
      onDaysChange(days.filter((d) => d.id !== dayId));
      if (expandedDayId === dayId) {
        setExpandedDayId(null);
      }
    },
    [days, onDaysChange, expandedDayId]
  );

  const handleDayNameChange = useCallback(
    (dayId: string, name: string) => {
      onDaysChange(days.map((d) => (d.id === dayId ? { ...d, name } : d)));
    },
    [days, onDaysChange]
  );

  const handleRemoveExercise = useCallback(
    (dayId: string, exerciseId: number) => {
      onDaysChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: d.exercises.filter((ex) => ex.id !== exerciseId),
              }
            : d
        )
      );
    },
    [days, onDaysChange]
  );

  const handleUpdateExercise = useCallback(
    (
      dayId: string,
      exerciseId: number,
      field: "sets" | "reps" | "weight",
      value: number
    ) => {
      onDaysChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: d.exercises.map((ex) =>
                  ex.id === exerciseId ? { ...ex, [field]: value } : ex
                ),
              }
            : d
        )
      );
    },
    [days, onDaysChange]
  );

  const handleMoveExercise = useCallback(
    (dayId: string, index: number, direction: "up" | "down") => {
      onDaysChange(
        days.map((d) => {
          if (d.id !== dayId) return d;
          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= d.exercises.length) return d;
          const updated = [...d.exercises];
          [updated[index], updated[newIndex]] = [
            updated[newIndex],
            updated[index],
          ];
          return { ...d, exercises: updated };
        })
      );
    },
    [days, onDaysChange]
  );

  const handleMoveDay = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= days.length) return;
      const updated = [...days];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      onDaysChange(updated);
    },
    [days, onDaysChange]
  );

  const handleSave = useCallback(() => {
    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
    if (!programName.trim() || days.length === 0 || totalExercises === 0)
      return;

    const existing = loadSavedPrograms();
    if (editProgramId) {
      const updated = existing.map((p) =>
        p.id === editProgramId ? { ...p, name: programName.trim(), days } : p
      );
      persistSavedPrograms(updated);
    } else {
      const program: SavedProgram = {
        id: `program-${Date.now()}`,
        name: programName.trim(),
        days,
        createdAt: new Date().toISOString(),
      };
      persistSavedPrograms([...existing, program]);
    }
    trackEvent(editProgramId ? "custom_plan_edited" : "custom_plan_created", {
      day_count: days.length,
      total_exercises: totalExercises,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  }, [programName, days, editProgramId, onSave]);

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
  const canSave =
    programName.trim().length > 0 && days.length > 0 && totalExercises > 0;

  return (
    <PageContainer contentClassName="px-4 py-6">
      <div className="flex flex-col h-full pb-40">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/60 text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">
            {isEditing
              ? t("createProgramPage.titleEdit")
              : t("createProgramPage.titleCreate")}
          </h1>
        </div>

        {/* Program Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">
            {t("createProgramPage.programNameLabel")}
          </label>
          <input
            type="text"
            value={programName}
            onChange={(e) => onProgramNameChange(e.target.value)}
            placeholder={t("createProgramPage.programNamePlaceholder")}
            className="w-full px-4 py-3 rounded-xl bg-[#1B1E2B] text-white placeholder-white/30 border border-white/10 focus:border-main/50 focus:outline-none focus:ring-1 focus:ring-main/30 transition-colors"
          />
        </div>

        {/* Training Days */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              {t("createProgramPage.trainingDays", { count: days.length })}
            </h2>
          </div>

          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-[#1B1E2B]/50 border border-dashed border-white/10">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-white/20 mb-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-white/40 text-sm">
                {t("createProgramPage.noTrainingDaysTitle")}
              </p>
              <p className="text-white/25 text-xs mt-1">
                {t("createProgramPage.noTrainingDaysHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {days.map((day, dayIndex) => (
                <TrainingDayCard
                  key={day.id}
                  day={day}
                  dayIndex={dayIndex}
                  totalDays={days.length}
                  isExpanded={expandedDayId === day.id}
                  onToggleExpand={() =>
                    setExpandedDayId(expandedDayId === day.id ? null : day.id)
                  }
                  onNameChange={(name) => handleDayNameChange(day.id, name)}
                  onRemoveDay={() => handleRemoveDay(day.id)}
                  onMoveDay={(dir) => handleMoveDay(dayIndex, dir)}
                  onRemoveExercise={(exId) =>
                    handleRemoveExercise(day.id, exId)
                  }
                  onUpdateExercise={(exId, field, val) =>
                    handleUpdateExercise(day.id, exId, field, val)
                  }
                  onMoveExercise={(idx, dir) =>
                    handleMoveExercise(day.id, idx, dir)
                  }
                  onAddExercise={() => onAddExercise(day.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Day Button */}
        <button
          onClick={handleAddDay}
          className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#1B1E2B]/80 border border-dashed border-main/30 hover:border-main/60 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-main/10 flex items-center justify-center group-hover:bg-main/20 transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-main"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-main font-semibold">
            {t("createProgramPage.addTrainingDay")}
          </span>
        </button>
      </div>

      {/* Bottom Save Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent z-50">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-3.5 rounded-xl font-semibold uppercase transition-all ${
            canSave
              ? saved
                ? "bg-emerald-600 text-white"
                : "bg-main text-white hover:brightness-110"
              : "bg-main/30 text-white/30 cursor-not-allowed"
          }`}
        >
          {saved
            ? t("createProgramPage.saved")
            : t("createProgramPage.saveProgram")}
        </button>
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */

interface TrainingDayCardProps {
  day: TrainingDay;
  dayIndex: number;
  totalDays: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNameChange: (name: string) => void;
  onRemoveDay: () => void;
  onMoveDay: (direction: "up" | "down") => void;
  onRemoveExercise: (exerciseId: number) => void;
  onUpdateExercise: (
    exerciseId: number,
    field: "sets" | "reps" | "weight",
    value: number
  ) => void;
  onMoveExercise: (index: number, direction: "up" | "down") => void;
  onAddExercise: () => void;
}

function TrainingDayCard({
  day,
  dayIndex,
  totalDays,
  isExpanded,
  onToggleExpand,
  onNameChange,
  onRemoveDay,
  onMoveDay,
  onRemoveExercise,
  onUpdateExercise,
  onMoveExercise,
  onAddExercise,
}: TrainingDayCardProps) {
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <div className="rounded-xl bg-[#1B1E2B] ring-1 ring-white/5 shadow-xl overflow-hidden">
      {/* Day Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => {
          if (!isEditingName) onToggleExpand();
        }}
      >
        {/* Expand chevron */}
        <div
          className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/50"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        {/* Day name */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={day.name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-white font-semibold text-sm border-b border-main/50 outline-none pb-0.5"
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">
                {day.name}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-white/40 text-xs">
            {t("createProgramPage.exerciseCount", { count: day.exercises.length })}
          </p>
        </div>

        {/* Day actions */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onMoveDay("up")}
            disabled={dayIndex === 0}
            className={`p-1.5 rounded-lg transition-colors ${dayIndex === 0 ? "text-white/15" : "text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDay("down")}
            disabled={dayIndex === totalDays - 1}
            className={`p-1.5 rounded-lg transition-colors ${dayIndex === totalDays - 1 ? "text-white/15" : "text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button
            onClick={onRemoveDay}
            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5">
          {day.exercises.length > 0 && (
            <div className="space-y-2 mt-3">
              {day.exercises.map((exercise, index) => (
                <ExerciseConfigCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  total={day.exercises.length}
                  onRemove={() => onRemoveExercise(exercise.id)}
                  onUpdate={(field, value) =>
                    onUpdateExercise(exercise.id, field, value)
                  }
                  onMove={(direction) => onMoveExercise(index, direction)}
                />
              ))}
            </div>
          )}

          <button
            onClick={onAddExercise}
            className="flex items-center gap-2 w-full p-3 mt-3 rounded-lg bg-white/5 border border-dashed border-main/20 hover:border-main/50 transition-colors group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-main/70 group-hover:text-main"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-main/70 group-hover:text-main text-sm font-medium">
              {t("createProgramPage.addExercise")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ExerciseConfigCardProps {
  exercise: Exercise;
  index: number;
  total: number;
  onRemove: () => void;
  onUpdate: (field: "sets" | "reps" | "weight", value: number) => void;
  onMove: (direction: "up" | "down") => void;
}

function ExerciseConfigCard({
  exercise,
  index,
  total,
  onRemove,
  onUpdate,
  onMove,
}: ExerciseConfigCardProps) {
  const { t } = useTranslation();
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  return (
    <div className="rounded-xl bg-white/5 p-3">
      {/* Top row: image + name + actions */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          <LazyImage
            src={getExerciseImageUrl(exercise)}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {name}
          </p>
          <p className="text-white/40 text-xs truncate">
            {exercise.muscle_groups.join(", ")}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className={`p-1.5 rounded-lg transition-colors ${index === 0 ? "text-white/15" : "text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className={`p-1.5 rounded-lg transition-colors ${index === total - 1 ? "text-white/15" : "text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Config row: sets / reps / weight */}
      <div className="flex gap-2">
        <NumberStepper
          label={t("createProgramPage.sets")}
          value={exercise.sets}
          min={1}
          max={20}
          onChange={(v) => onUpdate("sets", v)}
        />
        <NumberStepper
          label={t("createProgramPage.reps")}
          value={exercise.reps}
          min={1}
          max={100}
          onChange={(v) => onUpdate("reps", v)}
        />
        <NumberStepper
          label={exercise.weight_unit || t("createProgramPage.weightUnit")}
          value={exercise.weight}
          min={0}
          max={500}
          step={2.5}
          onChange={(v) => onUpdate("weight", v)}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface NumberStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

function NumberStepper({
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
}: NumberStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  const displayValue = step % 1 !== 0 ? value.toFixed(1) : String(value);

  return (
    <div className="flex-1 rounded-lg bg-white/5 p-2">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider text-center mb-1.5">
        {label}
      </p>
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={decrement}
          disabled={value <= min}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-sm font-bold"
        >
          −
        </button>
        <span className="text-white font-semibold text-sm min-w-[2rem] text-center">
          {displayValue}
        </span>
        <button
          onClick={increment}
          disabled={value >= max}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
