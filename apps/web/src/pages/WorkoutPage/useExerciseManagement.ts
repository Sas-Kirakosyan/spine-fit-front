import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SwapDurationOption } from "@spinefit/shared";
import type { Exercise } from "@/types/exercise";
import {
  getPlan,
  savePlan,
  subscribe as subscribeToPlan,
} from "@/lib/planService";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import {
  getSelectedDayIndex,
  subscribeSelectedDay,
} from "@/storage/selectedDayStorage";

interface UseExerciseManagementOptions {
  completedWorkoutIds: Set<string>;
  isCustomWorkout?: boolean;
  externalExercises?: Exercise[];
}

interface UseExerciseManagementReturn {
  todaysExercises: Exercise[];
  setTodaysExercises: Dispatch<SetStateAction<Exercise[]>>;
  isLoading: boolean;
  updateCurrentWorkoutInPlan: (
    updateExercises: (exercises: Exercise[]) => Exercise[]
  ) => boolean;
  deleteExercise: (exercise: Exercise) => void;
  replaceExercise: (
    oldExercise: Exercise,
    selectedReplacement: Exercise,
    duration: SwapDurationOption
  ) => void;
}

export function useExerciseManagement({
  completedWorkoutIds,
  isCustomWorkout = false,
  externalExercises,
}: UseExerciseManagementOptions): UseExerciseManagementReturn {
  const [todaysExercises, setTodaysExercises] = useState<Exercise[]>(() =>
    isCustomWorkout && externalExercises?.length ? externalExercises : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isCustomWorkout);

  const loadCurrentWorkoutExercises = useCallback((): Exercise[] => {
    const plan = getPlan();
    if (!plan) return [];

    const manualIndex = getSelectedDayIndex();
    if (
      manualIndex !== null &&
      manualIndex < plan.workoutDays.length &&
      plan.workoutDays[manualIndex].exercises.length > 0
    ) {
      return plan.workoutDays[manualIndex].exercises;
    }

    const next = getNextAvailableWorkout(plan, completedWorkoutIds);
    if (next && next.exercises.length > 0) return next.exercises;

    if (
      plan.workoutDays.length > 0 &&
      plan.workoutDays[0].exercises.length > 0
    ) {
      return plan.workoutDays[0].exercises;
    }
    return [];
  }, [completedWorkoutIds]);

  // Custom workout mode: stay in sync with externalExercises
  useEffect(() => {
    if (!isCustomWorkout) return;
    if (externalExercises && externalExercises.length > 0) {
      setTodaysExercises(externalExercises);
    }
    setIsLoading(false);
  }, [isCustomWorkout, externalExercises]);

  // Plan mode: load + subscribe to plan and selected-day changes
  useEffect(() => {
    if (isCustomWorkout) return;
    setTodaysExercises(loadCurrentWorkoutExercises());
    setIsLoading(false);
    const unsubPlan = subscribeToPlan(() => {
      setTodaysExercises(loadCurrentWorkoutExercises());
    });
    const unsubDay = subscribeSelectedDay(() => {
      setTodaysExercises(loadCurrentWorkoutExercises());
    });
    return () => {
      unsubPlan();
      unsubDay();
    };
  }, [loadCurrentWorkoutExercises, isCustomWorkout]);

  const updateCurrentWorkoutInPlan = useCallback(
    (updateExercises: (exercises: Exercise[]) => Exercise[]): boolean => {
      const plan = getPlan();
      if (!plan) return false;

      let workoutIndex = -1;
      const manualIndex = getSelectedDayIndex();
      if (
        manualIndex !== null &&
        manualIndex >= 0 &&
        manualIndex < plan.workoutDays.length
      ) {
        workoutIndex = manualIndex;
      }

      if (workoutIndex === -1) {
        const currentWorkout = getNextAvailableWorkout(
          plan,
          completedWorkoutIds
        );
        if (!currentWorkout) return false;

        workoutIndex = plan.workoutDays.findIndex(
          (day) =>
            day.dayNumber === currentWorkout.dayNumber &&
            day.dayName === currentWorkout.dayName
        );
      }
      if (workoutIndex === -1) return false;

      plan.workoutDays[workoutIndex].exercises = updateExercises(
        plan.workoutDays[workoutIndex].exercises
      );
      savePlan(plan);
      return true;
    },
    [completedWorkoutIds]
  );

  const deleteExercise = useCallback(
    (exerciseToDelete: Exercise) => {
      try {
        if (!isCustomWorkout) {
          const removedFromCurrent = updateCurrentWorkoutInPlan((exercises) =>
            exercises.filter((ex) => ex.id !== exerciseToDelete.id)
          );

          // Fallback: if current-workout detection failed, scrub from any day
          // that still references the exercise so the plan view stays consistent.
          if (!removedFromCurrent) {
            const plan = getPlan();
            if (plan) {
              let removed = false;
              for (const workoutDay of plan.workoutDays) {
                const beforeCount = workoutDay.exercises.length;
                workoutDay.exercises = workoutDay.exercises.filter(
                  (ex) => ex.id !== exerciseToDelete.id
                );
                if (workoutDay.exercises.length < beforeCount) removed = true;
              }
              if (removed) savePlan(plan);
            }
          }
        }
        setTodaysExercises((prev) =>
          prev.filter((ex) => ex.id !== exerciseToDelete.id)
        );
      } catch (error) {
        console.error("Error deleting exercise:", error);
      }
    },
    [isCustomWorkout, updateCurrentWorkoutInPlan]
  );

  const replaceExercise = useCallback(
    (
      oldExercise: Exercise,
      selectedReplacement: Exercise,
      duration: SwapDurationOption
    ) => {
      const replacement: Exercise = {
        ...selectedReplacement,
        sets: oldExercise.sets,
        reps: oldExercise.reps,
        weight: oldExercise.weight,
        weight_unit: oldExercise.weight_unit,
      };

      const replaceInWorkout = (exercises: Exercise[]) =>
        exercises.map((ex) => (ex.id === oldExercise.id ? replacement : ex));

      try {
        if (isCustomWorkout) {
          setTodaysExercises((prev) => replaceInWorkout(prev));
          return;
        }

        if (duration === "plan") {
          const plan = getPlan();
          if (plan) {
            plan.workoutDays = plan.workoutDays.map((day) => ({
              ...day,
              exercises: replaceInWorkout(day.exercises),
            }));
            savePlan(plan);
          }
        } else {
          updateCurrentWorkoutInPlan(replaceInWorkout);
        }
        setTodaysExercises((prev) => replaceInWorkout(prev));
      } catch (error) {
        console.error("Error replacing exercise:", error);
      }
    },
    [isCustomWorkout, updateCurrentWorkoutInPlan]
  );

  return {
    todaysExercises,
    setTodaysExercises,
    isLoading,
    updateCurrentWorkoutInPlan,
    deleteExercise,
    replaceExercise,
  };
}
