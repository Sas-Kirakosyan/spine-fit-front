import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Exercise } from "../types/exercise";
import type { ExerciseSetRow, SetField } from "../types/workout";

export type ExerciseSetsMode = "preWorkout" | "activeWorkout";

interface WorkoutState {
  // Выбранное упражнение
  selectedExercise: Exercise | null;
  
  // Режим работы с сетами
  exerciseSetsMode: ExerciseSetsMode;
  
  // Завершенные упражнения
  completedExerciseIds: number[];
  
  // Упражнение для popup
  actionExercise: Exercise | null;
  
  // Таймер тренировки (в секундах)
  workoutTimer: number;
  
  // Сеты для каждого упражнения (ключ - exerciseId)
  exerciseSets: Record<number, ExerciseSetRow[]>;
  
  // Активный сет для каждого упражнения (ключ - exerciseId)
  activeSetIndexes: Record<number, number>;
  
  // Таймер отдыха для каждого упражнения
  restTimerEnabled: Record<number, boolean>;
  
  // Уровень боли для каждого упражнения
  painLevels: Record<number, number>;
}

interface WorkoutContextValue extends WorkoutState {
  // Управление выбранным упражнением
  setSelectedExercise: (exercise: Exercise | null) => void;
  
  // Управление режимом
  setExerciseSetsMode: (mode: ExerciseSetsMode) => void;
  
  // Управление завершенными упражнениями
  markExerciseComplete: (exerciseId: number) => void;
  clearCompletedExercises: () => void;
  
  // Управление popup
  setActionExercise: (exercise: Exercise | null) => void;
  
  // Управление таймером тренировки
  setWorkoutTimer: (seconds: number) => void;
  resetWorkoutTimer: () => void;
  
  // Управление сетами
  initializeExerciseSets: (exercise: Exercise) => void;
  getExerciseSets: (exerciseId: number) => ExerciseSetRow[];
  updateExerciseSet: (exerciseId: number, index: number, field: SetField, value: string) => void;
  addExerciseSet: (exerciseId: number) => void;
  logExerciseSet: (exerciseId: number, index: number) => void;
  logAllExerciseSets: (exerciseId: number) => void;
  
  // Управление активным сетом
  setActiveSetIndex: (exerciseId: number, index: number) => void;
  getActiveSetIndex: (exerciseId: number) => number;
  
  // Управление таймером отдыха
  toggleRestTimer: (exerciseId: number) => void;
  isRestTimerEnabled: (exerciseId: number) => boolean;
  
  // Управление уровнем боли
  setPainLevel: (exerciseId: number, level: number) => void;
  getPainLevel: (exerciseId: number) => number;
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

const ONE_HOUR_SECONDS = 60 * 60;

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseSetsMode, setExerciseSetsMode] = useState<ExerciseSetsMode>("preWorkout");
  const [completedExerciseIds, setCompletedExerciseIds] = useState<number[]>([]);
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState<number>(ONE_HOUR_SECONDS);
  const [exerciseSets, setExerciseSets] = useState<Record<number, ExerciseSetRow[]>>({});
  const [activeSetIndexes, setActiveSetIndexes] = useState<Record<number, number>>({});
  const [restTimerEnabled, setRestTimerEnabled] = useState<Record<number, boolean>>({});
  const [painLevels, setPainLevels] = useState<Record<number, number>>({});

  // Таймер тренировки
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setWorkoutTimer((prev) => {
        if (prev <= 0) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // Управление завершенными упражнениями
  const markExerciseComplete = useCallback((exerciseId: number) => {
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
  }, []);

  const clearCompletedExercises = useCallback(() => {
    setCompletedExerciseIds([]);
  }, []);

  // Сброс таймера тренировки
  const resetWorkoutTimer = useCallback(() => {
    setWorkoutTimer(ONE_HOUR_SECONDS);
  }, []);

  // Инициализация сетов для упражнения
  const initializeExerciseSets = useCallback((exercise: Exercise) => {
    const exerciseId = exercise.id;

    setExerciseSets((prev) => {
      if (prev[exerciseId]) {
        return prev; // Уже инициализировано
      }

      const initialSetTemplate: ExerciseSetRow = {
        reps: exercise.reps ? String(exercise.reps) : "",
        weight: exercise.weight ? String(exercise.weight) : "",
        completed: false,
      };

      const count = Math.max(exercise.sets || 1, 1);
      const newSets = Array.from({ length: count }, () => ({ ...initialSetTemplate }));

      return {
        ...prev,
        [exerciseId]: newSets,
      };
    });

    setActiveSetIndexes((prev) => {
      if (prev[exerciseId] !== undefined) {
        return prev;
      }
      return {
        ...prev,
        [exerciseId]: 0,
      };
    });

    // Инициализация уровня боли по умолчанию
    setPainLevels((prev) => {
      if (prev[exerciseId] !== undefined) {
        return prev;
      }
      return {
        ...prev,
        [exerciseId]: 2,
      };
    });
  }, []);

  // Получение сетов для упражнения
  const getExerciseSets = useCallback((exerciseId: number): ExerciseSetRow[] => {
    return exerciseSets[exerciseId] || [];
  }, [exerciseSets]);

  // Обновление сета
  const updateExerciseSet = useCallback((
    exerciseId: number,
    index: number,
    field: SetField,
    value: string
  ) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseId] || [];
      if (sets[index]?.completed) {
        return prev;
      }
      const updated = sets.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
    setActiveSetIndexes((prev) => ({
      ...prev,
      [exerciseId]: index,
    }));
  }, []);

  // Добавление сета
  const addExerciseSet = useCallback((exerciseId: number) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseId] || [];
      const lastSet = sets[sets.length - 1];
      const newSet: ExerciseSetRow = lastSet
        ? { ...lastSet, completed: false }
        : { reps: "", weight: "", completed: false };
      
      const updated = [...sets, newSet];
      
      // Обновляем активный индекс, если он был -1
      setActiveSetIndexes((currentIndexes) => {
        const currentIndex = currentIndexes[exerciseId] ?? -1;
        if (currentIndex === -1) {
          return {
            ...currentIndexes,
            [exerciseId]: updated.length - 1,
          };
        }
        return currentIndexes;
      });
      
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  }, []);

  // Поиск следующего незавершенного сета
  const findNextPendingIndex = useCallback((
    sets: ExerciseSetRow[],
    startFrom: number = 0
  ): number => {
    for (let i = startFrom; i < sets.length; i += 1) {
      if (!sets[i].completed) {
        return i;
      }
    }
    return -1;
  }, []);

  // Логирование сета
  const logExerciseSet = useCallback((exerciseId: number, index: number) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseId] || [];
      if (sets.length === 0 || sets.every((item) => item.completed)) {
        return prev;
      }
      if (index < 0 || index >= sets.length || sets[index]?.completed) {
        return prev;
      }

      const updated = sets.map((item, itemIndex) =>
        itemIndex === index ? { ...item, completed: true } : item
      );

      const nextAfter = findNextPendingIndex(updated, index + 1);
      const fallback = nextAfter !== -1 ? nextAfter : findNextPendingIndex(updated, 0);

      setActiveSetIndexes((prev) => ({
        ...prev,
        [exerciseId]: fallback,
      }));

      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  }, [findNextPendingIndex]);

  // Логирование всех сетов
  const logAllExerciseSets = useCallback((exerciseId: number) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseId] || [];
      const updated = sets.map((item) => ({ ...item, completed: true }));
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
    setActiveSetIndexes((prev) => ({
      ...prev,
      [exerciseId]: -1,
    }));
  }, []);

  // Управление активным сетом
  const setActiveSetIndex = useCallback((exerciseId: number, index: number) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseId] || [];
      if (sets[index]?.completed) {
        return prev;
      }
      return prev;
    });
    setActiveSetIndexes((prev) => ({
      ...prev,
      [exerciseId]: index,
    }));
  }, []);

  const getActiveSetIndex = useCallback((exerciseId: number): number => {
    return activeSetIndexes[exerciseId] ?? 0;
  }, [activeSetIndexes]);

  // Управление таймером отдыха
  const toggleRestTimer = useCallback((exerciseId: number) => {
    setRestTimerEnabled((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  }, []);

  const isRestTimerEnabled = useCallback((exerciseId: number): boolean => {
    return restTimerEnabled[exerciseId] ?? false;
  }, [restTimerEnabled]);

  // Управление уровнем боли
  const setPainLevel = useCallback((exerciseId: number, level: number) => {
    setPainLevels((prev) => ({
      ...prev,
      [exerciseId]: level,
    }));
  }, []);

  const getPainLevel = useCallback((exerciseId: number): number => {
    return painLevels[exerciseId] ?? 2;
  }, [painLevels]);

  const value: WorkoutContextValue = useMemo(
    () => ({
      selectedExercise,
      exerciseSetsMode,
      completedExerciseIds,
      actionExercise,
      workoutTimer,
      exerciseSets,
      activeSetIndexes,
      restTimerEnabled,
      painLevels,
      setSelectedExercise,
      setExerciseSetsMode,
      markExerciseComplete,
      clearCompletedExercises,
      setActionExercise,
      setWorkoutTimer,
      resetWorkoutTimer,
      initializeExerciseSets,
      getExerciseSets,
      updateExerciseSet,
      addExerciseSet,
      logExerciseSet,
      logAllExerciseSets,
      setActiveSetIndex,
      getActiveSetIndex,
      toggleRestTimer,
      isRestTimerEnabled,
      setPainLevel,
      getPainLevel,
    }),
    [
      selectedExercise,
      exerciseSetsMode,
      completedExerciseIds,
      actionExercise,
      workoutTimer,
      exerciseSets,
      activeSetIndexes,
      restTimerEnabled,
      painLevels,
      markExerciseComplete,
      clearCompletedExercises,
      resetWorkoutTimer,
      initializeExerciseSets,
      getExerciseSets,
      updateExerciseSet,
      addExerciseSet,
      logExerciseSet,
      logAllExerciseSets,
      setActiveSetIndex,
      getActiveSetIndex,
      toggleRestTimer,
      isRestTimerEnabled,
      setPainLevel,
      getPainLevel,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}

