import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PlanState {
  completedWorkoutIds: string[];

  addCompletedWorkoutId: (id: string) => void;
  setCompletedWorkoutIds: (ids: string[]) => void;
  clearCompletedWorkoutIds: () => void;
  getCompletedWorkoutIdsSet: () => Set<string>;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      completedWorkoutIds: [],

      addCompletedWorkoutId: (id) =>
        set((state) => ({
          completedWorkoutIds: state.completedWorkoutIds.includes(id)
            ? state.completedWorkoutIds
            : [...state.completedWorkoutIds, id],
        })),

      setCompletedWorkoutIds: (ids) => set({ completedWorkoutIds: ids }),
      clearCompletedWorkoutIds: () => set({ completedWorkoutIds: [] }),

      getCompletedWorkoutIdsSet: () => new Set(get().completedWorkoutIds),
    }),
    {
      name: "plan-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
