import { useState, useEffect, useCallback } from "react";
import type { Exercise } from "@/types/exercise";
import {
  loadPlanFromLocalStorage,
  savePlanToLocalStorage,
} from "@/storage/planStorage";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";

interface UseExerciseManagementReturn {
  todaysExercises: Exercise[];
  setTodaysExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  updateCurrentWorkoutInPlan: (
    updateExercises: (exercises: Exercise[]) => Exercise[]
  ) => boolean;
}

export function useExerciseManagement(
  completedWorkoutIds: Set<string>
): UseExerciseManagementReturn {
  const [todaysExercises, setTodaysExercises] = useState<Exercise[]>([]);

  const loadCurrentWorkoutExercises = useCallback((): Exercise[] => {
    const generatedPlan = loadPlanFromLocalStorage();

    if (generatedPlan) {
      // Prefer manually selected day from swap sheet
      const manualIndex = localStorage.getItem("selectedWorkoutDayIndex");
      if (manualIndex !== null) {
        const idx = parseInt(manualIndex, 10);
        if (
          !isNaN(idx) &&
          idx < generatedPlan.workoutDays.length &&
          generatedPlan.workoutDays[idx].exercises.length > 0
        ) {
          return generatedPlan.workoutDays[idx].exercises;
        }
      }

      // Get the next available workout based on completion status
      const activeWorkout = getNextAvailableWorkout(
        generatedPlan,
        completedWorkoutIds
      );
      if (activeWorkout && activeWorkout.exercises.length > 0) {
        return activeWorkout.exercises;
      }
      // Fallback to first workout day if no workout is found
      if (
        generatedPlan.workoutDays.length > 0 &&
        generatedPlan.workoutDays[0].exercises.length > 0
      ) {
        return generatedPlan.workoutDays[0].exercises;
      }
    }
    return [];
  }, [completedWorkoutIds]);

  // Load current active workout from generated plan
  useEffect(() => {
    setTodaysExercises(loadCurrentWorkoutExercises());
  }, [loadCurrentWorkoutExercises]);

  const updateCurrentWorkoutInPlan = useCallback(
    (updateExercises: (exercises: Exercise[]) => Exercise[]): boolean => {
      const generatedPlan = loadPlanFromLocalStorage();
      if (!generatedPlan) return false;

      // Prefer manually selected day
      let workoutIndex = -1;
      const manualIndex = localStorage.getItem("selectedWorkoutDayIndex");
      if (manualIndex !== null) {
        const idx = parseInt(manualIndex, 10);
        if (!isNaN(idx) && idx < generatedPlan.workoutDays.length) {
          workoutIndex = idx;
        }
      }

      if (workoutIndex === -1) {
        const currentWorkout = getNextAvailableWorkout(
          generatedPlan,
          completedWorkoutIds
        );
        if (!currentWorkout) return false;

        workoutIndex = generatedPlan.workoutDays.findIndex(
          (day) =>
            day.dayNumber === currentWorkout.dayNumber &&
            day.dayName === currentWorkout.dayName
        );
      }
      if (workoutIndex === -1) return false;

      generatedPlan.workoutDays[workoutIndex].exercises = updateExercises(
        generatedPlan.workoutDays[workoutIndex].exercises as Exercise[]
      );
      savePlanToLocalStorage(generatedPlan);
      return true;
    },
    [completedWorkoutIds]
  );

  return {
    todaysExercises,
    setTodaysExercises,
    updateCurrentWorkoutInPlan,
  };
}
