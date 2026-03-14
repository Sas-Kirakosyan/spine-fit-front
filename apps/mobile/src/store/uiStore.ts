import { create } from "zustand";
import type { Exercise } from "@spinefit/shared";

interface UIState {
  selectedExercise: Exercise | null;
  exerciseSetsMode: "preWorkout" | "activeWorkout";
  allExerciseReturnPage: "workout" | "createProgram";
  selectedExerciseProgressId: number | null;

  setSelectedExercise: (exercise: Exercise | null) => void;
  setExerciseSetsMode: (mode: "preWorkout" | "activeWorkout") => void;
  setAllExerciseReturnPage: (page: "workout" | "createProgram") => void;
  setSelectedExerciseProgressId: (id: number | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedExercise: null,
  exerciseSetsMode: "preWorkout",
  allExerciseReturnPage: "workout",
  selectedExerciseProgressId: null,

  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
  setExerciseSetsMode: (mode) => set({ exerciseSetsMode: mode }),
  setAllExerciseReturnPage: (page) => set({ allExerciseReturnPage: page }),
  setSelectedExerciseProgressId: (id) => set({ selectedExerciseProgressId: id }),
}));
