import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Exercise, ExerciseSetRow } from "@spinefit/shared";

interface WorkoutState {
  workoutExercises: Exercise[];
  completedExerciseIds: number[];
  exerciseLogs: Record<number, ExerciseSetRow[]>;
  workoutStartTime: number | null;
  isCustomWorkoutMode: boolean;

  setWorkoutExercises: (exercises: Exercise[] | ((prev: Exercise[]) => Exercise[])) => void;
  addExercises: (exercises: Exercise[]) => void;
  removeExercise: (id: number) => void;
  setCompletedExerciseIds: (ids: number[] | ((prev: number[]) => number[])) => void;
  markExerciseComplete: (exerciseId: number, sets: ExerciseSetRow[]) => void;
  setExerciseLogs: (logs: Record<number, ExerciseSetRow[]> | ((prev: Record<number, ExerciseSetRow[]>) => Record<number, ExerciseSetRow[]>)) => void;
  setWorkoutStartTime: (time: number | null) => void;
  setIsCustomWorkoutMode: (isCustom: boolean) => void;
  resetWorkoutState: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      workoutExercises: [],
      completedExerciseIds: [],
      exerciseLogs: {},
      workoutStartTime: null,
      isCustomWorkoutMode: false,

      setWorkoutExercises: (exercises) =>
        set((state) => ({
          workoutExercises:
            typeof exercises === "function" ? exercises(state.workoutExercises) : exercises,
        })),

      addExercises: (exercises) =>
        set((state) => {
          const existingIds = new Set(state.workoutExercises.map((ex) => ex.id));
          const newExercises = exercises.filter((ex) => !existingIds.has(ex.id));
          return { workoutExercises: [...state.workoutExercises, ...newExercises] };
        }),

      removeExercise: (id) =>
        set((state) => ({
          workoutExercises: state.workoutExercises.filter((ex) => ex.id !== id),
        })),

      setCompletedExerciseIds: (ids) =>
        set((state) => ({
          completedExerciseIds:
            typeof ids === "function" ? ids(state.completedExerciseIds) : ids,
        })),

      markExerciseComplete: (exerciseId, sets) =>
        set((state) => {
          const completedSets = sets.filter((s) => s.completed).map((s) => ({ ...s }));
          return {
            exerciseLogs: { ...state.exerciseLogs, [exerciseId]: completedSets },
            completedExerciseIds: state.completedExerciseIds.includes(exerciseId)
              ? state.completedExerciseIds
              : [...state.completedExerciseIds, exerciseId],
          };
        }),

      setExerciseLogs: (logs) =>
        set((state) => ({
          exerciseLogs: typeof logs === "function" ? logs(state.exerciseLogs) : logs,
        })),

      setWorkoutStartTime: (time) => set({ workoutStartTime: time }),
      setIsCustomWorkoutMode: (isCustom) => set({ isCustomWorkoutMode: isCustom }),

      resetWorkoutState: () =>
        set({
          completedExerciseIds: [],
          exerciseLogs: {},
          workoutStartTime: null,
        }),
    }),
    {
      name: "workout-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workoutExercises: state.workoutExercises,
      }),
    }
  )
);
