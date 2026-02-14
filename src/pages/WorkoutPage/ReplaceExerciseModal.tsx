import type { Exercise } from "@/types/exercise";
import { Button } from "@/components/Buttons/Button";

interface ReplaceExerciseModalProps {
  replaceExercise: Exercise;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredExercises: Exercise[];
  onSelectReplacement: (replacement: Exercise) => void;
  onClose: () => void;
}

export function ReplaceExerciseModal({
  // replaceExercise is received for type safety but currently unused
  // Can be used for additional context display in the future
  searchQuery,
  onSearchChange,
  filteredExercises,
  onSelectReplacement,
  onClose,
}: ReplaceExerciseModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70">
      <div className="mx-auto w-full max-w-[440px] rounded-t-[24px] border-t border-white/10 bg-[#161827] px-4 pb-5 pt-4">
        <div className="mb-3 text-center">
          <h3 className="text-lg font-semibold text-white">Replace exercise</h3>
          <p className="mt-1 text-sm text-slate-400">
            Choose from all exercises
          </p>
        </div>

        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search exercise..."
          className="mb-3 h-11 w-full rounded-[10px] border border-white/10 bg-[#1D2030] px-3 text-white outline-none focus:border-main"
        />

        <div
          className="max-h-[52vh] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredExercises.length > 0 ? (
            filteredExercises.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectReplacement(item)}
                className="flex w-full items-center gap-3 rounded-[12px] bg-[#1F2232] p-2 text-left text-white ring-1 ring-white/5"
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
              No exercises found
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="mt-3 h-11 w-full rounded-[10px] bg-[#232639] text-sm font-semibold text-white"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
