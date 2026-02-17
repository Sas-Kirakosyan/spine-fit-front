import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import { Button } from "@/components/Buttons/Button";

export type SwapDurationOption = "workout" | "plan";

interface ReplaceExerciseModalProps {
  replaceExercise: Exercise;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  suggestedExercises: Exercise[];
  allExercises: Exercise[];
  onConfirmSwap: (replacement: Exercise, duration: SwapDurationOption) => void;
  onClose: () => void;
}

export function ReplaceExerciseModal({
  replaceExercise,
  searchQuery,
  onSearchChange,
  suggestedExercises,
  allExercises,
  onConfirmSwap,
  onClose,
}: ReplaceExerciseModalProps) {
  const [activeTab, setActiveTab] = useState<"suggested" | "all">("suggested");
  const [selectedReplacementId, setSelectedReplacementId] = useState<
    number | null
  >(null);
  const [swapDuration, setSwapDuration] =
    useState<SwapDurationOption>("workout");

  const visibleExercises = useMemo(
    () => (activeTab === "suggested" ? suggestedExercises : allExercises),
    [activeTab, suggestedExercises, allExercises],
  );

  const selectedReplacement = useMemo(
    () =>
      allExercises.find((exercise) => exercise.id === selectedReplacementId),
    [allExercises, selectedReplacementId],
  );

  useEffect(() => {
    setSelectedReplacementId(null);
    setSwapDuration("workout");
  }, [replaceExercise.id]);

  const emptyStateText =
    activeTab === "suggested"
      ? `No suggested alternatives found for ${replaceExercise.name}`
      : "No exercises found";

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70">
      <div className="mx-auto w-full max-w-[440px] rounded-t-[24px] border-t border-white/10 bg-[#161827] px-4 pb-5 pt-4">
        <div className="mb-3 text-center">
          <h3 className="text-lg font-semibold text-white">Replace exercise</h3>
        </div>

        <div className="mb-3 flex h-10 rounded-[10px] bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("suggested")}
            className={`flex-1 rounded-[8px] text-sm font-semibold transition-colors ${
              activeTab === "suggested"
                ? "bg-main text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Suggested Alternatives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 rounded-[8px] text-sm font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-main text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            All Exercises
          </button>
        </div>

        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search exercise..."
          className="mb-3 h-11 w-full rounded-[10px] border border-white/10 bg-[#1D2030] px-3 text-white outline-none focus:border-main"
        />

        <div
          className="max-h-[44vh] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visibleExercises.length > 0 ? (
            visibleExercises.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedReplacementId(item.id)}
                className={`flex w-full items-center gap-3 rounded-[12px] p-2 text-left text-white ring-1 transition-colors ${
                  selectedReplacementId === item.id
                    ? "bg-main/20 ring-main"
                    : "bg-[#1F2232] ring-white/5"
                }`}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-12 w-12 rounded-[8px] object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {item.muscle_groups.join(", ")}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">
              {emptyStateText}
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-sm font-semibold text-white">Swap duration</p>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              onClick={() => setSwapDuration("workout")}
              className="flex items-center gap-2 text-left text-white"
            >
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  swapDuration === "workout"
                    ? "border-main"
                    : "border-slate-500"
                } flex items-center justify-center`}
              >
                {swapDuration === "workout" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-main" />
                )}
              </span>
              <span className="text-[15px]">Only for this workout</span>
            </button>

            <button
              type="button"
              onClick={() => setSwapDuration("plan")}
              className="flex items-center gap-2 text-left text-white"
            >
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  swapDuration === "plan" ? "border-main" : "border-slate-500"
                } flex items-center justify-center`}
              >
                {swapDuration === "plan" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-main" />
                )}
              </span>
              <span className="text-[15px]">Permanent replacement in plan</span>
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={onClose}
              className="h-11 flex-1 rounded-[10px] bg-[#6B7280] text-sm font-semibold text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedReplacement) {
                  onConfirmSwap(selectedReplacement, swapDuration);
                }
              }}
              disabled={!selectedReplacement}
              className="h-11 flex-1 rounded-[10px] bg-main text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Swap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
