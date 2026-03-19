import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FinishedWorkoutSummary } from "@spinefit/shared";

interface HistoryState {
  workoutHistory: FinishedWorkoutSummary[];

  addWorkout: (summary: FinishedWorkoutSummary) => void;
  setWorkoutHistory: (history: FinishedWorkoutSummary[]) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      workoutHistory: [],

      addWorkout: (summary) =>
        set((state) => ({
          workoutHistory: [...state.workoutHistory, summary],
        })),

      setWorkoutHistory: (history) => set({ workoutHistory: history }),
      clearHistory: () => set({ workoutHistory: [] }),
    }),
    {
      name: "history-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
