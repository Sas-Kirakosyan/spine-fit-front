import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  switchToSplit,
  type GeneratedPlan,
  loadPlanFromLocalStorage,
  loadAlternativeSplitsFromLocalStorage,
} from "@/utils/planGenerator";

interface SwapWorkoutActionSheetProps {
  onClose: () => void;
  currentWorkout?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelectWorkout?: (workout: string) => void;
  onSwitchSplit?: (plan: GeneratedPlan) => void;
}

const workoutDays = [
  {
    id: "push",
    name: "Push Day",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: "pull",
    name: "Pull Day",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "legs",
    name: "Leg Day",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300"
      >
        <path d="M12 2v6m0 8v6M4 12h16" />
        <path d="M8 8l8 8M16 8l-8 8" />
      </svg>
    ),
  },
];

const newWorkoutOptions = [
  {
    id: "pick-muscles",
    name: "Pick Muscles",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400"
      >
        {/* Left figure (chest) */}
        <circle cx="6" cy="8" r="2.5" />
        <path d="M6 10.5v3M4 12h4" />
        {/* Center figure (back) */}
        <circle cx="12" cy="8" r="2.5" />
        <path d="M12 10.5v3M10 12h4" />
        {/* Right figure (legs) */}
        <circle cx="18" cy="8" r="2.5" />
        <path d="M18 10.5v5M16.5 14h3" />
      </svg>
    ),
  },
  {
    id: "saved-workouts",
    name: "Saved Workouts",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "create-scratch",
    name: "Create Workout From Scratch",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: "import",
    name: "Import Workout",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
];

export function SwapWorkoutActionSheet({
  onClose,
  currentWorkout = "pull",
  containerRef,
  onSelectWorkout,
  onSwitchSplit,
}: SwapWorkoutActionSheetProps) {
  const [selectedWorkout, setSelectedWorkout] = useState(currentWorkout);
  const [availableSplits, setAvailableSplits] = useState<Set<string>>(
    new Set(),
  );
  const [currentSplitType, setCurrentSplitType] = useState<string | null>(null);

  // Helper function to check if split type is an Upper/Lower variant
  const isUpperLowerType = (type: string | null): boolean => {
    return (
      type === "BRO_SPLIT" ||
      type === "FULL_BODY_AB" ||
      type === "UPPER_LOWER" ||
      type === "UPPER_LOWER_4X" ||
      type === "UPPER_LOWER_UPPER" ||
      type === "UPPER_LOWER_STRENGTH_HYPERTROPHY"
    );
  };

  // Check which splits are available and which is current
  useEffect(() => {
    const plan = loadPlanFromLocalStorage();
    if (plan) {
      setCurrentSplitType(plan.splitType);

      // Load alternatives from separate storage
      const alternatives = loadAlternativeSplitsFromLocalStorage();
      if (alternatives.length > 0) {
        const splitTypes = new Set(alternatives.map((alt) => alt.splitType));
        setAvailableSplits(splitTypes);
      }
    }
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    if (onSelectWorkout) {
      onSelectWorkout(workoutId);
    }
  };

  const sheetContent = (
    <div className="absolute h-full w-full z-1000 inset-0 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close action sheet"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full">
        <div className="bg-[#161827] border-t rounded-t-[30px] max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="px-5 pb-8 pt-4 sm:px-6">
            <h2 className="text-2xl text-center font-bold text-white mb-6">
              Swap Workout
            </h2>

            {/* Within Training Split Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
                Within Training Split
              </h3>
              <div className="space-y-2">
                {workoutDays.map((day) => {
                  const isSelected = selectedWorkout === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => handleWorkoutSelect(day.id)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
                          {day.icon}
                        </div>
                        <span className="text-white font-medium">
                          {day.name}
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested Training Splits Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
                Suggested Splits (Coach-Recommended)
              </h3>
              <div className="space-y-3">
                {/* Upper/Lower Split Card */}
                <button
                  disabled={isUpperLowerType(currentSplitType)}
                  onClick={() => {
                    if (isUpperLowerType(currentSplitType)) return;
                    const updatedPlan = switchToSplit("BRO_SPLIT");
                    if (updatedPlan && onSwitchSplit) {
                      onSwitchSplit(updatedPlan);
                    }
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl transition-all text-left relative ${
                    isUpperLowerType(currentSplitType)
                      ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-700/50 cursor-default"
                      : availableSplits.has("BRO_SPLIT")
                        ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 hover:from-blue-900/60 hover:to-blue-800/60 border border-blue-700/50 cursor-pointer"
                        : "bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold ${isUpperLowerType(currentSplitType) ? "text-white" : availableSplits.has("BRO_SPLIT") ? "text-white" : "text-white/50"}`}
                        >
                          Upper/Lower Split
                        </p>
                        {isUpperLowerType(currentSplitType) && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${isUpperLowerType(currentSplitType) ? "text-white/70" : availableSplits.has("BRO_SPLIT") ? "text-white/60" : "text-white/40"}`}
                      >
                        2x per week per muscle • 3+ days
                      </p>
                    </div>
                    {isUpperLowerType(currentSplitType) ? (
                      <svg
                        className="h-5 w-5 text-green-400 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="8" r="7" />
                        <path d="M5 8l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg
                        className={`h-5 w-5 flex-shrink-0 ${availableSplits.has("BRO_SPLIT") ? "text-blue-400" : "text-gray-600"}`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Push/Pull/Legs Card */}
                <button
                  disabled={currentSplitType === "PPL"}
                  onClick={() => {
                    if (currentSplitType === "PPL") return;
                    const updatedPlan = switchToSplit("PPL");
                    if (updatedPlan && onSwitchSplit) {
                      onSwitchSplit(updatedPlan);
                    }
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl transition-all text-left relative ${
                    currentSplitType === "PPL"
                      ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-700/50 cursor-default"
                      : availableSplits.has("PPL")
                        ? "bg-gradient-to-r from-purple-900/40 to-purple-800/40 hover:from-purple-900/60 hover:to-purple-800/60 border border-purple-700/50 cursor-pointer"
                        : "bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold ${currentSplitType === "PPL" ? "text-white" : availableSplits.has("PPL") ? "text-white" : "text-white/50"}`}
                        >
                          Push/Pull/Legs
                        </p>
                        {currentSplitType === "PPL" && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${currentSplitType === "PPL" ? "text-white/70" : availableSplits.has("PPL") ? "text-white/60" : "text-white/40"}`}
                      >
                        PPL • 3-6 days/week
                      </p>
                    </div>
                    {currentSplitType === "PPL" ? (
                      <svg
                        className="h-5 w-5 text-green-400 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="8" r="7" />
                        <path d="M5 8l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg
                        className={`h-5 w-5 flex-shrink-0 ${availableSplits.has("PPL") ? "text-purple-400" : "text-gray-600"}`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Bro Split Card (5-day body-part split) */}
                <button
                  disabled={currentSplitType === "FRESH_MUSCLES"}
                  onClick={() => {
                    if (currentSplitType === "FRESH_MUSCLES") return;
                    const updatedPlan = switchToSplit("FRESH_MUSCLES");
                    if (updatedPlan && onSwitchSplit) {
                      onSwitchSplit(updatedPlan);
                    }
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl transition-all text-left relative ${
                    currentSplitType === "FRESH_MUSCLES"
                      ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-700/50 cursor-default"
                      : availableSplits.has("FRESH_MUSCLES")
                        ? "bg-gradient-to-r from-amber-900/40 to-amber-800/40 hover:from-amber-900/60 hover:to-amber-800/60 border border-amber-700/50 cursor-pointer"
                        : "bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold ${currentSplitType === "FRESH_MUSCLES" ? "text-white" : availableSplits.has("FRESH_MUSCLES") ? "text-white" : "text-white/50"}`}
                        >
                          Bro Split
                        </p>
                        {currentSplitType === "FRESH_MUSCLES" && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${currentSplitType === "FRESH_MUSCLES" ? "text-white/70" : availableSplits.has("FRESH_MUSCLES") ? "text-white/60" : "text-white/40"}`}
                      >
                        One muscle per day • 5+ days
                      </p>
                    </div>
                    {currentSplitType === "FRESH_MUSCLES" ? (
                      <svg
                        className="h-5 w-5 text-green-400 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="8" r="7" />
                        <path d="M5 8l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg
                        className={`h-5 w-5 flex-shrink-0 ${availableSplits.has("FRESH_MUSCLES") ? "text-amber-400" : "text-gray-600"}`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* New Workout Section */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
                New Workout
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {newWorkoutOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (onSelectWorkout) {
                        onSelectWorkout(option.id);
                      }
                      onClose();
                    }}
                    className="flex flex-col items-start gap-1 p-1 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {option.icon}
                    </div>
                    <span className="text-white text-sm font-medium text-left">
                      {option.name}
                    </span>
                    <svg
                      className="ml-auto h-4 w-4 text-white/60"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, containerRef.current ?? document.body);
}
