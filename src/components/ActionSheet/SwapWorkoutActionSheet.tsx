import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SwapWorkoutActionSheetProps {
  onClose: () => void;
  currentWorkout?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelectWorkout?: (workout: string) => void;
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
}: SwapWorkoutActionSheetProps) {
  const [selectedWorkout, setSelectedWorkout] = useState(currentWorkout);

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
                        <span className="text-white font-medium">{day.name}</span>
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