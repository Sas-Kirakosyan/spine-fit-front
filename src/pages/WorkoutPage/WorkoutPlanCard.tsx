import { useState } from "react";
import { SwapWorkoutActionSheet } from "../../components/ActionSheet/SwapWorkoutActionSheet";
import type { GeneratedPlan } from "@/utils/planGenerator";

interface WorkoutPlanCardProps {
  planName?: string;
  dayName?: string;
  exerciseCount?: number;
  muscleCount?: number;
  duration?: string;
  location?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onWorkoutSwap?: (workoutId: string) => void;
  onPlanSwitched?: (plan: GeneratedPlan) => void;
}

export function WorkoutPlanCard({
  planName = "Pull Day",
  dayName = "Pull Day",
  exerciseCount = 3,
  muscleCount = 3,
  duration = "1h 1m",
  location = "My Gym",
  containerRef,
  onWorkoutSwap,
  onPlanSwitched,
}: WorkoutPlanCardProps) {
  const [showSwapSheet, setShowSwapSheet] = useState(false);

  const getCurrentWorkoutId = () => {
    const name = planName.toLowerCase();
    if (name.includes("push")) return "push";
    if (name.includes("pull")) return "pull";
    if (name.includes("leg")) return "legs";
    return "pull";
  };

  return (
    <>
      <div className="relative rounded-[14px] bg-[#1B1E2B]/90 p-4 mx-2.5 shadow-xl ring-1 ring-white/5">
        {/* Top right buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setShowSwapSheet(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="M16 21l4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
            Swap
          </button>
          <button className="text-white hover:text-white/80 transition-colors p-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="pr-32">
          <h2 className="text-2xl font-bold text-white mb-1">{dayName}</h2>
          <p className="text-xs text-white/60 mb-3">{planName}</p>
          <p className="text-sm text-white/80">
            {exerciseCount} Exercises • {muscleCount} Muscles
          </p>

          {/* Bottom buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-full bg-gray-700/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700/80 transition-colors">
              {duration}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button className="flex items-center gap-1.5 rounded-full bg-gray-700/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700/80 transition-colors">
              {location}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showSwapSheet && (
        <SwapWorkoutActionSheet
          onClose={() => setShowSwapSheet(false)}
          currentWorkout={getCurrentWorkoutId()}
          containerRef={containerRef}
          onSelectWorkout={(workoutId) => {
            if (onWorkoutSwap) {
              onWorkoutSwap(workoutId);
            }
            setShowSwapSheet(false);
          }}
          onSwitchSplit={(plan) => {
            if (onPlanSwitched) {
              onPlanSwitched(plan);
            }
            setShowSwapSheet(false);
          }}
        />
      )}
    </>
  );
}
