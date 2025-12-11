import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ExerciseActionSheetProps } from "@/types/workout";
import { ActionButton } from "@/components/ActionSheet/ActionButton/ActionButton";
import { InfoIcon, PlayIcon, TrashIcon } from "@/components/Icons/Icons";

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
    <div className="absolute h-full w-full z-1000 inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close action sheet"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full">
        <div className="bg-[#161827] h-[420px] border-t rounded-t-[30px]">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-6 px-5 pb-8 pt-4 sm:px-6">
            <div>
              <h2 className="mt-2 text-2xl text-center font-semibold text-white">
                {exercise.name}
              </h2>
            </div>
            <ActionButton
              icon={<InfoIcon />}
              text="View details"
              onClick={() => {
                onShowDetails();
                onClose();
              }}
              variant="default"
            />
            {onStartWorkout && (
              <ActionButton
                icon={<PlayIcon />}
                text="View sets"
                onClick={() => {
                  onStartWorkout();
                  onClose();
                }}
                variant="blue"
              />
            )}
            <ActionButton
              icon={<TrashIcon />}
              text="Delete from workout"
              onClick={() => {
                onDelete?.();
                onClose();
              }}
              variant="red"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, containerRef.current ?? document.body);
}
