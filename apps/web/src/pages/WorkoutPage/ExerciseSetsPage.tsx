import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Exercise } from "@/types/exercise";
import {
  useExerciseName,
  getAllBaseExercises,
  getBaseExerciseById,
  isTimeBasedExercise,
  formatDurationSeconds,
} from "@spinefit/shared";
import { getExerciseImageUrl } from "@/utils/exercise";
import type {
  ExerciseSetsPageProps,
  SetField,
  ExerciseSetRow,
} from "@/types/workout";
import { PageContainer } from "@/Layout/PageContainer";
import { ExerciseSet } from "@/pages/WorkoutPage/ExerciseSet";
import { RestTimerModal } from "@/pages/WorkoutPage/RestTimerModal";
import { SetTimeModal } from "@/pages/WorkoutPage/SetTimeModal";
import {
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/constants/workout";
import { Button } from "@/components/Buttons/Button";
import { LazyImage } from "@/components/ui/LazyImage";
import { QuizSlider } from "@/components/Quiz/QuizSlider";
import {
  loadPlanFromLocalStorage,
  savePlanToLocalStorage,
} from "@/storage/planStorage";
import {
  shouldShowPainTracking,
  getStoredPainStatus,
} from "@/utils/painStatus";
import { trackEvent } from "@/utils/analytics";

const toolbarButtons = [
  {
    id: "timer",
    label: "Rest timer",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M9 3h6" />
        <path d="M10 6h4" />
      </svg>
    ),
  },
  {
    id: "warmup",
    label: "Warm-up",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />
      </svg>
    ),
  },
  {
    id: "replace",
    label: "Replace",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h13"></path>
        <path d="M13 3l4 4-4 4"></path>

        <path d="M20 17H7"></path>
        <path d="M11 21l-4-4 4-4"></path>
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
];

function ExerciseSetsPage({
  exercise,
  onNavigateBack,
  onStartWorkoutSession,
  onNavigateToHistory,
  onMarkExerciseComplete,
  onSkipExercise,
  isDuringActiveWorkout = false,
  exerciseLogs = {},
}: ExerciseSetsPageProps) {
  const { t } = useTranslation();
  const { getExerciseName } = useExerciseName();
  const exerciseDisplayName = getExerciseName(exercise);
  const allExercises = getAllBaseExercises();
  const baseExercise = getBaseExerciseById(exercise.id);
  const isBodyweight = exercise.equipment === "bodyweight";
  const isTimeBased = isTimeBasedExercise(exercise);

  // Generate unique ID for each set
  const generateSetId = () =>
    `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Time-based sets start at zero so the user sees 00:00 + Start and can
  // choose between manual entry (tap digits → modal) or the Start timer flow.
  const defaultReps = isTimeBased
    ? "0"
    : exercise.reps !== undefined && exercise.reps !== null
      ? String(exercise.reps)
      : "";

  const createNewSet = (
    template?: Partial<ExerciseSetRow>
  ): ExerciseSetRow => ({
    id: generateSetId(),
    reps: defaultReps,
    weight:
      isTimeBased ? "0" :
      exercise.weight !== undefined && exercise.weight !== null
        ? String(exercise.weight)
        : "",
    completed: false,
    ...template,
  });

  const [restTimerModalOpen, setRestTimerModalOpen] = useState(false);
  const [restTimerEnabled, setRestTimerEnabled] = useState(false);
  const [restDurationMinutes, setRestDurationMinutes] = useState(1);
  const [restDurationSeconds, setRestDurationSeconds] = useState(0);
  const [restCountdownSeconds, setRestCountdownSeconds] = useState<
    number | null
  >(null);
  const [restPaused, setRestPaused] = useState(false);
  type ExerciseTimerState = {
    setIndex: number;
    elapsedSeconds: number;
    status: "running" | "paused";
  };
  const [exerciseTimer, setExerciseTimer] = useState<ExerciseTimerState | null>(
    null
  );
  const [setTimeModalIndex, setSetTimeModalIndex] = useState<number | null>(
    null
  );
  const [warmupEnabled, setWarmupEnabled] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState("");
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showPainSlider = shouldShowPainTracking();
  const painRequired = getStoredPainStatus() === "Active Symptoms";

  // Get saved logs for this exercise if they exist
  const savedLogs = exerciseLogs[exercise.id];

  const [sets, setSets] = useState<ExerciseSetRow[]>(() => {
    // If we have saved logs, use them; otherwise create new sets from template
    if (savedLogs && savedLogs.length > 0) {
      return savedLogs.map((log) => ({
        ...log,
        id: log.id || generateSetId(),
      }));
    }

    const count = Math.max(exercise.sets || 1, 1);
    return Array.from({ length: count }, () => createNewSet());
  });
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [painLevel, setPainLevel] = useState(2);

  useEffect(() => {
    // Restore saved logs if they exist, otherwise reset to template
    if (savedLogs && savedLogs.length > 0) {
      setSets(
        savedLogs.map((log) => ({
          ...log,
          id: log.id || generateSetId(),
        }))
      );
      // Find first incomplete set or set to -1 if all completed
      const firstIncomplete = savedLogs.findIndex((s) => !s.completed);
      setActiveSetIndex(firstIncomplete !== -1 ? firstIncomplete : -1);
    } else {
      const count = Math.max(exercise.sets || 1, 1);
      setSets(Array.from({ length: count }, () => createNewSet()));
      setActiveSetIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, savedLogs]);

  useEffect(() => {
    setActiveSetIndex((prev) => {
      if (prev === -1) {
        return prev;
      }
      return Math.min(prev, Math.max(sets.length - 1, 0));
    });
  }, [sets.length]);

  // Rest timer countdown (не тикает при паузе)
  useEffect(() => {
    if (
      restCountdownSeconds === null ||
      restCountdownSeconds <= 0 ||
      restPaused
    ) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      if (restCountdownSeconds === 0) {
        setRestCountdownSeconds(null);
      }
      return () => {
        if (restIntervalRef.current) {
          clearInterval(restIntervalRef.current);
        }
      };
    }
    restIntervalRef.current = setInterval(() => {
      setRestCountdownSeconds((prev) =>
        prev !== null && prev > 0 ? prev - 1 : null
      );
    }, 1000);
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [restCountdownSeconds, restPaused]);

  useEffect(() => {
    if (!exerciseTimer || exerciseTimer.status !== "running") {
      return;
    }
    const id = setInterval(() => {
      setExerciseTimer((prev) =>
        prev && prev.status === "running"
          ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }
          : prev
      );
    }, 1000);
    return () => clearInterval(id);
  }, [exerciseTimer?.status, exerciseTimer?.setIndex]);

  useEffect(() => {
    setExerciseTimer(null);
  }, [exercise.id]);

  const generateWarmupSets = (): ExerciseSetRow[] => {
    const workingWeight = Number(exercise.weight);
    if (!workingWeight || workingWeight <= 0 || isBodyweight || isTimeBased) return [];

    const percents = [0.2, 0.4, 0.6];
    const repsPerSet = [12, 8, 6];
    return percents.map((pct, i) =>
      createNewSet({
        weight: String(Math.round((workingWeight * pct) / 2.5) * 2.5),
        reps: String(repsPerSet[i]),
        type: "warmup",
      })
    );
  };

  const handleToggleWarmup = () => {
    if (warmupEnabled) {
      // Remove all warmup sets
      setSets((prev) => {
        const filtered = prev.filter((s) => s.type !== "warmup");
        return filtered.length > 0 ? filtered : prev;
      });
      setWarmupEnabled(false);
    } else {
      // Prepend warmup sets
      const warmupSets = generateWarmupSets();
      if (warmupSets.length > 0) {
        setSets((prev) => [...warmupSets, ...prev]);
      }
      setWarmupEnabled(true);
    }
  };

  const findNextPendingIndex = (
    list: ExerciseSetRow[],
    startFrom = 0
  ): number => {
    for (let i = startFrom; i < list.length; i += 1) {
      if (!list[i].completed) {
        return i;
      }
    }
    return -1;
  };

  const isSetValid = (setEntry: ExerciseSetRow): boolean => {
    const reps = Number(setEntry.reps);
    const hasValidReps =
      setEntry.reps.trim() !== "" && !Number.isNaN(reps) && reps > 0;
    if (isTimeBased || isBodyweight) {
      return hasValidReps;
    }

    return (
      hasValidReps &&
      setEntry.weight.trim() !== "" &&
      !Number.isNaN(Number(setEntry.weight)) &&
      Number(setEntry.weight) >= 0
    );
  };

  const handleActivateSet = (index: number) => {
    if (sets[index]?.completed) {
      return;
    }
    setActiveSetIndex(index);
  };

  const handleSetValueChange = (
    index: number,
    field: SetField,
    value: string
  ) => {
    if (sets[index]?.completed) {
      return;
    }

    // Блокируем ввод отрицательных чисел
    // Запрещаем ввод минуса в любом виде
    if (value.includes("-")) {
      return; // Не обновляем состояние, если значение содержит минус
    }

    // Дополнительная проверка: если значение можно преобразовать в число, проверяем что оно не отрицательное
    if (value !== "") {
      const numValue = Number(value);
      if (!Number.isNaN(numValue) && numValue < 0) {
        return; // Не обновляем состояние, если значение отрицательное
      }
    }

    setActiveSetIndex(index);
    setSets((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddSet = () => {
    setSets((prev) => {
      const next = [...prev, createNewSet()];
      trackEvent("set_added", {
        exercise_id: exercise.id,
        set_number: next.length,
        mode: isDuringActiveWorkout ? "activeWorkout" : "preWorkout",
      });
      if (activeSetIndex === -1) {
        setActiveSetIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleDeleteSet = (index: number) => {
    setSets((prevSets) => {
      // Don't allow deletion if only one set remains
      if (prevSets.length <= 1) return prevSets;

      const deletedSet = prevSets[index];

      const next = prevSets.filter((_, i) => i !== index);

      trackEvent("set_deleted", {
        exercise_id: exercise.id,
        set_index: index + 1,
        was_completed: deletedSet?.completed ?? false,
      });

      // Adjust active index if needed
      setActiveSetIndex((prevIndex) => {
        if (prevIndex >= next.length) {
          return Math.max(0, next.length - 1);
        }
        if (prevIndex > index) {
          return prevIndex - 1;
        }
        if (prevIndex === index) {
          // If deleting active set, find next incomplete set
          const nextIncomplete = next.findIndex((s) => !s.completed);
          return nextIncomplete !== -1
            ? nextIncomplete
            : Math.min(prevIndex, next.length - 1);
        }
        return prevIndex;
      });

      return next;
    });
  };

  const handleLogSet = (requestedIndex?: number) => {
    if (!isDuringActiveWorkout) {
      return;
    }
    if (sets.length === 0) {
      return;
    }
    const targetIndex =
      typeof requestedIndex === "number"
        ? requestedIndex
        : activeSetIndex >= 0 && activeSetIndex < sets.length
          ? activeSetIndex
          : -1;
    if (targetIndex === -1) {
      return;
    }

    const targetSet = sets[targetIndex];
    const shouldUnlog = targetSet.completed;
    if (!shouldUnlog && !isSetValid(targetSet)) {
      return;
    }

    setSets((prev) => {
      const updated = prev.map((item, index) =>
        index === targetIndex ? { ...item, completed: !shouldUnlog } : item
      );

      if (shouldUnlog) {
        setActiveSetIndex(targetIndex);
      } else {
        const nextAfter = findNextPendingIndex(updated, targetIndex + 1);
        const fallback =
          nextAfter !== -1 ? nextAfter : findNextPendingIndex(updated, 0);
        setActiveSetIndex(fallback);
      }
      return updated;
    });

    if (
      !shouldUnlog &&
      restTimerEnabled &&
      isDuringActiveWorkout &&
      targetIndex < sets.length - 1
    ) {
      const totalSeconds = restDurationMinutes * 60 + restDurationSeconds;
      if (totalSeconds > 0) {
        setRestCountdownSeconds(totalSeconds);
      }
    }

    if (!shouldUnlog) {
      trackEvent("set_logged", {
        exercise_id: exercise.id,
        set_index: targetIndex + 1,
        reps: Number(targetSet.reps) || 0,
        weight: Number(targetSet.weight) || 0,
        is_warmup: targetSet.type === "warmup",
      });
    }
  };

  const handleOpenSetTimeModal = (index: number) => {
    setSetTimeModalIndex(index);
  };

  const handleConfirmSetTime = (minutes: number, seconds: number) => {
    if (setTimeModalIndex === null) return;
    const total = minutes * 60 + seconds;
    handleSetValueChange(setTimeModalIndex, "reps", String(total));
    setActiveSetIndex(setTimeModalIndex);
    setSetTimeModalIndex(null);
  };

  const modalInitialSeconds = (() => {
    if (setTimeModalIndex === null) return 0;
    const raw = Number(sets[setTimeModalIndex]?.reps) || 0;
    return Math.max(0, Math.floor(raw));
  })();
  const modalInitialMin = Math.floor(modalInitialSeconds / 60);
  const modalInitialSec = modalInitialSeconds % 60;

  const handleStartExerciseTimer = (index: number) => {
    if (!isDuringActiveWorkout) {
      return;
    }
    setExerciseTimer({ setIndex: index, elapsedSeconds: 0, status: "running" });
    setActiveSetIndex(index);
  };

  const handlePauseExerciseTimer = () => {
    setExerciseTimer((prev) => (prev ? { ...prev, status: "paused" } : prev));
  };

  const handleResumeExerciseTimer = () => {
    setExerciseTimer((prev) => (prev ? { ...prev, status: "running" } : prev));
  };

  const handleConfirmExerciseTimer = (index: number) => {
    if (!isDuringActiveWorkout) {
      return;
    }
    if (!exerciseTimer || exerciseTimer.setIndex !== index) {
      return;
    }
    const elapsed = Math.max(1, exerciseTimer.elapsedSeconds);
    setSets((prev) => {
      const updated = prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, reps: String(elapsed), completed: true }
          : item
      );
      const nextAfter = findNextPendingIndex(updated, index + 1);
      const fallback =
        nextAfter !== -1 ? nextAfter : findNextPendingIndex(updated, 0);
      setActiveSetIndex(fallback);
      return updated;
    });
    setExerciseTimer(null);

    if (
      restTimerEnabled &&
      isDuringActiveWorkout &&
      index < sets.length - 1
    ) {
      const totalSeconds = restDurationMinutes * 60 + restDurationSeconds;
      if (totalSeconds > 0) {
        setRestCountdownSeconds(totalSeconds);
      }
    }
  };

  const handleLogAllSets = () => {
    if (!isDuringActiveWorkout) {
      return;
    }
    const incompleteSets = sets.filter((item) => !item.completed);
    if (incompleteSets.length === 0) {
      return;
    }

    const allIncompleteSetsValid = incompleteSets.every((setEntry) =>
      isSetValid(setEntry)
    );
    if (!allIncompleteSetsValid) {
      return;
    }

    setSets((prev) => prev.map((item) => ({ ...item, completed: true })));
    setActiveSetIndex(-1);
  };

  const handleCompleteExercise = () => {
    if (sets.length === 0) {
      return;
    }
    if (isDuringActiveWorkout && onMarkExerciseComplete) {
      onMarkExerciseComplete(
        exercise.id,
        workingSets.map((setEntry) => ({ ...setEntry })),
        showPainSlider ? painLevel : undefined
      );
      return;
    }
    onStartWorkoutSession();
  };

  const handleSkipExercise = () => {
    if (isDuringActiveWorkout && onSkipExercise) {
      onSkipExercise(exercise.id);
    }
  };

  const workingSets = sets.filter((s) => s.type !== "warmup");
  const warmupSets = sets.filter((s) => s.type === "warmup");

  const allSetsCompleted =
    workingSets.length > 0 &&
    workingSets.every((setEntry) => setEntry.completed);

  const allWarmupCompleted =
    warmupSets.length === 0 ||
    warmupSets.every((setEntry) => setEntry.completed);

  const canLogAllSets = useMemo(() => {
    if (!isDuringActiveWorkout) {
      return false;
    }
    const incompleteSets = sets.filter((item) => !item.completed);
    if (incompleteSets.length === 0) {
      return false;
    }
    return incompleteSets.every((setEntry) => isSetValid(setEntry));
  }, [sets, isDuringActiveWorkout]);

  const getPreviousValue = (index: number) => {
    const hasTemplateRow = index < Math.max(exercise.sets || 1, 1);
    if (!hasTemplateRow) {
      return "\u2014";
    }

    const repsValue =
      exercise.reps !== undefined && exercise.reps !== null
        ? String(exercise.reps)
        : "";
    if (!repsValue) {
      return "\u2014";
    }

    if (isTimeBased) {
      const timeValue = baseExercise ? String(baseExercise.reps) : repsValue;
      return formatDurationSeconds(Number(timeValue));
    }

    if (isBodyweight) {
      return `${t("exerciseSetsPage.table.bw")} x ${repsValue}`;
    }

    const weightValue =
      exercise.weight !== undefined && exercise.weight !== null
        ? String(exercise.weight)
        : "";
    if (!weightValue) {
      return "\u2014";
    }

    const unit = exercise.weight_unit?.trim() || "kg";
    return `${weightValue}${unit} x ${repsValue}`;
  };

  const filteredReplacementExercises = allExercises
    .filter((item) => {
      const query = replaceQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 || item.name.toLowerCase().includes(query);
      return item.id !== exercise.id && matchesQuery;
    })
    .slice(0, 80);

  const handleReplaceCurrentExercise = (selectedReplacement: Exercise) => {
    try {
      const plan = loadPlanFromLocalStorage();
      if (!plan) return;

      const workoutIndex = plan.workoutDays.findIndex((day) =>
        day.exercises.some((item) => item.id === exercise.id)
      );

      if (workoutIndex === -1) return;

      const hasDuplicateInWorkout = plan.workoutDays[
        workoutIndex
      ].exercises.some((item) => item.id === selectedReplacement.id);
      if (hasDuplicateInWorkout) {
        setReplaceModalOpen(false);
        setReplaceQuery("");
        onNavigateBack();
        return;
      }

      const replacementWithCurrentSets: Exercise = {
        ...selectedReplacement,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        weight_unit: exercise.weight_unit,
      };

      plan.workoutDays[workoutIndex].exercises = plan.workoutDays[
        workoutIndex
      ].exercises.map((item) =>
        item.id === exercise.id ? replacementWithCurrentSets : item
      );

      savePlanToLocalStorage(plan);
      setReplaceModalOpen(false);
      setReplaceQuery("");
      onNavigateBack();
    } catch (error) {
      console.error("Error replacing exercise from sets page:", error);
    }
  };

  return (
    <PageContainer
      backgroundImage={`url(${getExerciseImageUrl(exercise)})`}
      overlayClassName="bg-[#080A14]/85"
      contentClassName="gap-6 rounded-[28px] bg-[#0E1224]/95 px-6 pb-10 pt-6 text-white"
      fallbackBackgroundClassName="bg-[#0E1224]"
    >
      <div className="flex flex-1 flex-col gap-6">
        <header className="relative overflow-hidden rounded-[26px] border border-white/12 bg-[#191E31] shadow-xl">
          <LazyImage
            src={getExerciseImageUrl(exercise)}
            alt={exerciseDisplayName}
            className="h-56 w-full object-cover brightness-[0.88]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1122] via-transparent to-black/40" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6">
            <button
              type="button"
              onClick={onNavigateBack}
              className={iconButtonClass}
              aria-label="back to workout"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                if (exercise.video_url) {
                  window.open(exercise.video_url, "_blank", "noopener");
                }
              }}
              className={`${primaryButtonClass} bg-main text-white shadow-lg`}
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 10l4.553-3.165A1 1 0 0 1 21 7.656v8.688a1 1 0 0 1-1.447.821L15 14z" />
                <rect x="3" y="6" width="12" height="12" rx="2" />
              </svg>
              {t("exerciseSetsPage.howTo")}
            </button>
          </div>
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <h1 className="text-[28px] font-semibold text-white">
              {exerciseDisplayName}
            </h1>
          </div>
        </header>

        <div
          className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex h-[50px] w-max gap-2 pr-2">
            {toolbarButtons.map((item) => {
              const isTimer = item.id === "timer";
              const isWarmup = item.id === "warmup";
              const isActive =
                (isTimer && restTimerEnabled) || (isWarmup && warmupEnabled);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={
                    isTimer
                      ? isDuringActiveWorkout
                        ? () => setRestTimerModalOpen(true)
                        : undefined
                      : item.id === "warmup"
                        ? handleToggleWarmup
                        : item.id === "replace"
                          ? () => setReplaceModalOpen(true)
                          : item.id === "history"
                            ? onNavigateToHistory
                            : undefined
                  }
                  className={`${secondaryButtonClass} shrink-0 whitespace-nowrap ${
                    isActive
                      ? "border-main/70 text-main/70 shadow-inner shadow-main/20"
                      : ""
                  }`}
                >
                  <span className="flex gap-2">
                    <span
                      className={`flex items-center justify-center ${
                        isActive ? "text-main/70" : "text-slate-200"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>
                      {t(`exerciseSetsPage.toolbar.${item.id}`)}
                      {isTimer
                        ? `: ${restTimerEnabled ? t("exerciseSetsPage.toolbar.timerOn") : t("exerciseSetsPage.toolbar.timerOff")}`
                        : isWarmup
                          ? `: ${warmupEnabled ? t("exerciseSetsPage.toolbar.warmupOn") : t("exerciseSetsPage.toolbar.warmupOff")}`
                          : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isDuringActiveWorkout &&
          restCountdownSeconds !== null &&
          restCountdownSeconds > 0 && (
            <div className="flex items-center justify-center gap-3 rounded-[16px] border border-main bg-main/40 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/70">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2 2" />
                  <path d="M9 3h6" />
                  <path d="M10 6h4" />
                </svg>
              </span>
              <span className="min-w-[4rem] text-center text-lg font-semibold tabular-nums text-white">
                {t("exerciseSetsPage.restTimer.rest")}:{" "}
                {Math.floor(restCountdownSeconds / 60)}:
                {(restCountdownSeconds % 60).toString().padStart(2, "0")}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={
                    restPaused
                      ? () => setRestPaused(false)
                      : () => setRestPaused(true)
                  }
                  aria-label={restPaused ? "Продолжить" : "Пауза"}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  {restPaused ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestCountdownSeconds(null);
                    setRestPaused(false);
                  }}
                  aria-label="Выключить таймер"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {replaceModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end bg-black/70">
            <div className="mx-auto w-full max-w-[440px] rounded-t-[24px] border-t border-white/10 bg-[#161827] px-4 pb-5 pt-4">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-semibold text-white">
                  {t("exerciseSetsPage.replaceModal.title")}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {t("exerciseSetsPage.replaceModal.subtitle")}
                </p>
              </div>

              <input
                value={replaceQuery}
                onChange={(event) => setReplaceQuery(event.target.value)}
                placeholder={t(
                  "exerciseSetsPage.replaceModal.searchPlaceholder"
                )}
                className="mb-3 h-11 w-full rounded-[10px] border border-white/10 bg-[#1D2030] px-3 text-white outline-none focus:border-main"
              />

              <div
                className="max-h-[52vh] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {filteredReplacementExercises.length > 0 ? (
                  filteredReplacementExercises.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleReplaceCurrentExercise(item)}
                      className="flex w-full items-center gap-3 rounded-[12px] bg-[#1F2232] p-2 text-left text-white ring-1 ring-white/5"
                    >
                      <LazyImage
                        src={getExerciseImageUrl(item)}
                        alt={item.name}
                        className="h-12 w-12 rounded-[8px] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {item.muscle_groups.join(", ")}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-slate-400">
                    {t("exerciseSetsPage.replaceModal.noExercises")}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setReplaceModalOpen(false);
                  setReplaceQuery("");
                }}
                className="mt-3 h-11 w-full rounded-[10px] bg-[#232639] text-sm font-semibold text-white"
              >
                {t("exerciseSetsPage.replaceModal.cancel")}
              </button>
            </div>
          </div>
        )}

        {isDuringActiveWorkout && (
          <RestTimerModal
            isOpen={restTimerModalOpen}
            onClose={() => setRestTimerModalOpen(false)}
            enabled={restTimerEnabled}
            onEnabledChange={setRestTimerEnabled}
            durationMinutes={restDurationMinutes}
            durationSeconds={restDurationSeconds}
            onDurationChange={(min, sec) => {
              setRestDurationMinutes(min);
              setRestDurationSeconds(sec);
            }}
          />
        )}

        <SetTimeModal
          isOpen={setTimeModalIndex !== null}
          onClose={() => setSetTimeModalIndex(null)}
          initialMinutes={modalInitialMin}
          initialSeconds={modalInitialSec}
          onConfirm={handleConfirmSetTime}
        />

        <section className="flex-1 rounded-[26px] border border-white/12 bg-[#13172A] p-3 shadow-xl ring-1 ring-white/5">
          <div className="space-y-3">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_68px_68px_52px] items-center gap-2 px-2.5 pb-1 text-[14px] font-medium text-white/80">
              <span className="text-center">
                {t("exerciseSetsPage.table.set")}
              </span>
              <span className="text-left">
                {t("exerciseSetsPage.table.previous")}
              </span>
              {isTimeBased ? (
                <span className="col-span-3 text-center">
                  {t("exerciseSetsPage.table.min")}
                </span>
              ) : (
                <>
                  <span className="text-center">
                    {isBodyweight
                      ? t("exerciseSetsPage.table.bw")
                      : t("exerciseSetsPage.table.kg")}
                  </span>
                  <span className="text-center">
                    {t("exerciseSetsPage.table.reps")}
                  </span>
                  <span />
                </>
              )}
            </div>
            {warmupEnabled && warmupSets.length > 0 && (
              <div className="mb-1 mt-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
                {t("exerciseSetsPage.warmupSection")}
              </div>
            )}
            {sets.map((setEntry, index) => {
              const isFirstWorking =
                index > 0 &&
                setEntry.type !== "warmup" &&
                sets[index - 1]?.type === "warmup";
              // For display: warmup sets show W1, W2; working sets restart numbering from 1
              const warmupIndex = sets
                .slice(0, index + 1)
                .filter((s) => s.type === "warmup").length;
              const workingIndex = sets
                .slice(0, index + 1)
                .filter((s) => s.type !== "warmup").length;
              return (
                <div key={setEntry.id}>
                  {isFirstWorking && (
                    <div className="mb-1 mt-3 border-t border-white/8 pt-2 px-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                      {t("exerciseSetsPage.table.set")}
                    </div>
                  )}
                  <ExerciseSet
                    index={index}
                    setEntry={setEntry}
                    exercise={exercise}
                    previousValue={
                      setEntry.type === "warmup"
                        ? "—"
                        : getPreviousValue(workingIndex - 1)
                    }
                    isActive={index === activeSetIndex}
                    isCompleted={setEntry.completed}
                    canDelete={
                      setEntry.type === "warmup"
                        ? warmupSets.length > 1
                        : workingSets.length > 1
                    }
                    canLogSet={
                      isDuringActiveWorkout &&
                      (setEntry.completed || isSetValid(setEntry))
                    }
                    onActivate={handleActivateSet}
                    onValueChange={handleSetValueChange}
                    onLogSet={handleLogSet}
                    onDelete={handleDeleteSet}
                    displayLabel={
                      setEntry.type === "warmup" ? `W${warmupIndex}` : undefined
                    }
                    isTimeBased={isTimeBased}
                    timerStatus={
                      exerciseTimer?.setIndex === index
                        ? exerciseTimer.status
                        : "idle"
                    }
                    timerElapsedSeconds={
                      exerciseTimer?.setIndex === index
                        ? exerciseTimer.elapsedSeconds
                        : 0
                    }
                    onStartTimer={handleStartExerciseTimer}
                    onPauseTimer={handlePauseExerciseTimer}
                    onResumeTimer={handleResumeExerciseTimer}
                    onConfirmTimer={handleConfirmExerciseTimer}
                    onOpenTimeModal={
                      isTimeBased ? handleOpenSetTimeModal : undefined
                    }
                  />
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddSet}
              className="mt-5 flex h-[56px] w-full items-center justify-center rounded-full bg-[#1D1F27] text-[34px] font-semibold leading-none text-white/90 transition hover:bg-[#272A35]"
            >
              <span className="mt-0.5 text-[28px]">
                {t("exerciseSetsPage.addSet")}
              </span>
            </button>
          </div>
        </section>

        {allSetsCompleted && allWarmupCompleted && showPainSlider && (
          <section className="rounded-[24px] border border-white/12 bg-[#161A30] p-5 shadow-inner shadow-white/5">
            <div className="flex flex-col gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                {t("exerciseSetsPage.painLevel")}
              </span>
              <QuizSlider
                value={String(painLevel)}
                min={1}
                max={10}
                onChange={(val) => setPainLevel(Number(val))}
              />
            </div>
          </section>
        )}

        {allSetsCompleted && allWarmupCompleted ? (
          <div className="flex justify-between">
            <Button
              onClick={handleCompleteExercise}
              className={`h-[50px] ${showPainSlider && !painRequired ? "w-[180px]" : "w-full"} rounded-[12px] bg-emerald-500 text-base font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/30`}
            >
              {t("exerciseSetsPage.done")}
            </Button>
            {showPainSlider && !painRequired && (
              <Button
                onClick={handleSkipExercise}
                className="h-[50px] w-[180px] rounded-[12px] bg-main text-base font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/30"
              >
                {t("exerciseSetsPage.skip")}
              </Button>
            )}
          </div>
        ) : isDuringActiveWorkout ? (
          <div className="mx-5 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleLogAllSets}
              disabled={!canLogAllSets}
              className="h-[54px] flex-1 rounded-[10px] bg-main text-white uppercase disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("exerciseSetsPage.logAllSets")}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStartWorkoutSession}
            className="mx-5 h-[40px] rounded-[10px] bg-main text-white uppercase"
          >
            {t("exerciseSetsPage.startWorkout")}
          </Button>
        )}
      </div>
    </PageContainer>
  );
}

export default ExerciseSetsPage;
