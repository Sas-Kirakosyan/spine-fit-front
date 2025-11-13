import type { RefObject } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Exercise } from "../../types/exercise";

interface ExerciseActionSheetProps {
  exercise: Exercise;
  onClose: () => void;
  onShowDetails: () => void;
  onStartWorkout?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function ExerciseActionSheet({
  exercise,
  onClose,
  onShowDetails,
  onStartWorkout,
  onDelete,
  containerRef,
}: ExerciseActionSheetProps) {
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

  const sheetContent = (
    <div className="absolute h-full w-full inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close action sheet"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full">
        <div className="bg-[#161827] h-[420px] border-t rounded-t-[30px] shadow-2xl ring-1 ring-white/10">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-6 px-5 pb-8 pt-4 sm:px-6">
            <div>
              <h2 className="mt-2 text-2xl text-center font-semibold text-white">
                {exercise.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                onShowDetails();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-slate-700/40 p-4 text-left text-slate-200 transition hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-600/40 text-slate-100">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
                View details
              </span>
              <svg
                aria-hidden="true"
                className="h-4 w-4"
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
            {onStartWorkout && (
              <button
                type="button"
                onClick={() => {
                  onStartWorkout();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl bg-blue-600/10 p-4 text-left text-blue-300 transition hover:bg-blue-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18.5 6h-13" />
                      <path d="M5.5 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      <path d="M7 10h2v9H7z" />
                      <path d="M15 10h2v9h-2z" />
                      <path d="M11 10h2v9h-2z" />
                    </svg>
                  </span>
                  View sets
                </span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
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
            )}
            <button
              type="button"
              onClick={() => {
                onDelete?.();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-rose-600/10 p-4 text-left text-rose-300 transition hover:bg-rose-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/80"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </span>
                Delete from workout
              </span>
              <svg
                aria-hidden="true"
                className="h-4 w-4"
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
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, containerRef.current ?? document.body);
}
