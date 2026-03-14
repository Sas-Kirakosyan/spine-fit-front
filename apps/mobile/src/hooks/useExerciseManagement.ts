import { useState, useEffect } from "react";
import type { Exercise } from "@spinefit/shared";
import { getNextAvailableWorkout } from "@spinefit/shared";
import { loadPlanFromLocalStorage } from "../storage/planStorage";

export function useExerciseManagement(completedWorkoutIds: Set<string>) {
  const [todaysExercises, setTodaysExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const plan = await loadPlanFromLocalStorage();
    if (!plan) return;

    const activeWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
    if (activeWorkout) {
      setTodaysExercises(activeWorkout.exercises);
    }
  };

  const updateCurrentWorkoutInPlan = async (
    updateFn: (exercises: Exercise[]) => Exercise[]
  ): Promise<boolean> => {
    try {
      const { storage } = await import("../storage/storageAdapter");
      const planString = await storage.getItem("generatedPlan");
      if (!planString) return false;

      const plan = JSON.parse(planString);
      const activeWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
      if (!activeWorkout) return false;

      const workoutIndex = plan.workoutDays.findIndex(
        (day: any) =>
          day.dayNumber === activeWorkout.dayNumber && day.dayName === activeWorkout.dayName
      );

      if (workoutIndex === -1) return false;

      plan.workoutDays[workoutIndex].exercises = updateFn(
        plan.workoutDays[workoutIndex].exercises
      );
      await storage.setJSON("generatedPlan", plan);
      return true;
    } catch (error) {
      console.error("Error updating workout in plan:", error);
      return false;
    }
  };

  return { todaysExercises, setTodaysExercises, updateCurrentWorkoutInPlan, loadExercises };
}
