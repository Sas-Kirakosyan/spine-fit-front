import { create } from "zustand";
import type { TrainingDay } from "@spinefit/shared";

interface CreateProgramState {
  days: TrainingDay[];
  programName: string;
  editingProgramId: string | undefined;
  activeDayId: string | null;

  setDays: (days: TrainingDay[] | ((prev: TrainingDay[]) => TrainingDay[])) => void;
  setProgramName: (name: string) => void;
  setEditingProgramId: (id: string | undefined) => void;
  setActiveDayId: (id: string | null) => void;
  reset: () => void;
}

export const useCreateProgramStore = create<CreateProgramState>()((set) => ({
  days: [],
  programName: "",
  editingProgramId: undefined,
  activeDayId: null,

  setDays: (days) =>
    set((state) => ({
      days: typeof days === "function" ? days(state.days) : days,
    })),

  setProgramName: (name) => set({ programName: name }),
  setEditingProgramId: (id) => set({ editingProgramId: id }),
  setActiveDayId: (id) => set({ activeDayId: id }),

  reset: () =>
    set({
      days: [],
      programName: "",
      editingProgramId: undefined,
      activeDayId: null,
    }),
}));
