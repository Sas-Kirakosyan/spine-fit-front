import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReplaceIcon, TrashIcon } from "@/components/Icons/Icons";

const SWIPE_ACTION_WIDTH = 88;
const SWIPE_MAX_OFFSET = SWIPE_ACTION_WIDTH * 2;

interface SwipeableExerciseCardProps {
  exerciseId: number;
  isOpen: boolean;
  onOpenChange: (exerciseId: number | null) => void;
  onReplace: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function SwipeableExerciseCard({
  exerciseId,
  isOpen,
  onOpenChange,
  onReplace,
  onDelete,
  children,
}: SwipeableExerciseCardProps) {
  const { t } = useTranslation();
  const [offsetX, setOffsetX] = useState(isOpen ? -SWIPE_MAX_OFFSET : 0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const offsetRef = useRef(offsetX);
  const draggingRef = useRef(false);
  const isHorizontalSwipeRef = useRef(false);
  const movedRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) {
      setOffsetX(isOpen ? -SWIPE_MAX_OFFSET : 0);
    }
  }, [isOpen]);

  useEffect(() => {
    offsetRef.current = offsetX;
  }, [offsetX]);

  const finishSwipe = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const didHorizontalSwipe = isHorizontalSwipeRef.current;
    isHorizontalSwipeRef.current = false;
    setIsDragging(false);

    if (!didHorizontalSwipe) {
      movedRef.current = false;
      return;
    }

    const shouldOpen = offsetRef.current <= -SWIPE_MAX_OFFSET / 2;
    setOffsetX(shouldOpen ? -SWIPE_MAX_OFFSET : 0);
    onOpenChange(shouldOpen ? exerciseId : null);
    movedRef.current = false;
  };

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(null);
  };

  // The action runs on pointerup, so the browser still fires a trailing click
  // afterwards. Once the list re-renders, that click would land on whatever
  // element now sits under the pointer (the next card) — a phantom tap. We
  // swallow exactly one click to absorb it. The timeout clears the listener
  // if no click follows (e.g. keyboard or canceled gesture).
  const swallowNextClick = () => {
    const swallowClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      window.removeEventListener("click", swallowClick, true);
    };

    window.addEventListener("click", swallowClick, true);
    setTimeout(
      () => window.removeEventListener("click", swallowClick, true),
      500
    );
  };

  return (
    <div className="relative overflow-hidden rounded-[14px]">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
          }}
          onPointerUp={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            event.preventDefault();
            handleAction(onReplace);
            swallowNextClick();
          }}
          className="flex h-full w-[88px] flex-col items-center justify-center gap-2 bg-[#21243A] text-white"
          aria-label={t("workoutPage.swipeCard.replace")}
        >
          <ReplaceIcon className="h-6 w-6" />
          <span className="text-xs font-semibold">
            {t("workoutPage.swipeCard.replace")}
          </span>
        </button>
        <button
          type="button"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
          }}
          onPointerUp={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            event.preventDefault();
            handleAction(onDelete);
            swallowNextClick();
          }}
          className="flex h-full w-[88px] flex-col items-center justify-center gap-2 bg-[#D04A40] text-white"
          aria-label={t("workoutPage.swipeCard.delete")}
        >
          <TrashIcon className="h-6 w-6" />
          <span className="text-xs font-semibold">
            {t("workoutPage.swipeCard.delete")}
          </span>
        </button>
      </div>

      <div
        className={`relative ${isDragging ? "" : "transition-transform duration-200 ease-out"}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          touchAction: "pan-y",
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          startXRef.current = event.clientX;
          startYRef.current = event.clientY;
          startOffsetRef.current = offsetX;
          draggingRef.current = true;
          isHorizontalSwipeRef.current = false;
          movedRef.current = false;
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          const deltaX = event.clientX - startXRef.current;
          const deltaY = event.clientY - startYRef.current;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (!isHorizontalSwipeRef.current) {
            if (absY > 10 && absY > absX) {
              draggingRef.current = false;
              return;
            }
            if (absX > 12 && absX > absY) {
              isHorizontalSwipeRef.current = true;
              setIsDragging(true);
            } else {
              return;
            }
          }

          if (absX > 4) {
            movedRef.current = true;
          }
          const nextOffset = Math.max(
            -SWIPE_MAX_OFFSET,
            Math.min(0, startOffsetRef.current + deltaX)
          );
          setOffsetX(nextOffset);
        }}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClickCapture={(event) => {
          if (movedRef.current) {
            event.preventDefault();
            event.stopPropagation();
            movedRef.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
