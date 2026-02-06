import { useState, useRef } from "react";
import type { ExerciseSetProps } from "@/types/workout";
import { Input } from "@/components/Input/Input";

export type { ExerciseSetRow, SetField } from "@/types/workout";

const DELETE_THRESHOLD = 150; // Порог для удаления (свайп до конца)

export const ExerciseSet: React.FC<ExerciseSetProps> = ({
  index,
  setEntry,
  exercise,
  isActive,
  isCompleted,
  canDelete,
  onActivate,
  onValueChange,
  onDelete,
}) => {
  const isBodyweight = exercise.equipment === "bodyweight" || exercise.weight_unit === "bodyweight";
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const deleteCalledRef = useRef(false);

  // Можно удалить только если: есть возможность удаления И сет не выполнен
  const canSwipeToDelete = canDelete && !isCompleted;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Не блокировать тач на интерактивных элементах (INPUT, LABEL)
    const targetTag = (e.target as HTMLElement).tagName;
    if (targetTag === 'INPUT' || targetTag === 'LABEL') return;
    if (!canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Только свайп влево (отрицательные значения)
    const newTranslate = Math.min(0, diff);
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || !canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    isDraggingRef.current = false;

    // Если свайп достаточно далеко - удалить
    if (translateX < -DELETE_THRESHOLD) {
      deleteCalledRef.current = true;
      setIsDeleting(true);
      // Анимация ухода за экран
      setTranslateX(-window.innerWidth);
      setTimeout(() => {
        onDelete(index);
      }, 200);
    } else {
      // Вернуть назад
      setTranslateX(0);
    }
  };

  // Mouse events для поддержки компьютера
  const handleMouseDown = (e: React.MouseEvent) => {
    const targetTag = (e.target as HTMLElement).tagName;
    // Не блокировать клики на интерактивных элементах (INPUT, LABEL)
    if (targetTag === 'INPUT' || targetTag === 'LABEL') {
      return;
    }
    if (!canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    e.preventDefault();
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    const diff = e.clientX - startXRef.current;
    const newTranslate = Math.min(0, diff);
    setTranslateX(newTranslate);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current || !canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    isDraggingRef.current = false;

    if (translateX < -DELETE_THRESHOLD) {
      deleteCalledRef.current = true;
      setIsDeleting(true);
      setTranslateX(-window.innerWidth);
      setTimeout(() => {
        onDelete(index);
      }, 200);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    // Если мышь покинула элемент во время перетаскивания - вернуть назад
    if (isDraggingRef.current && !deleteCalledRef.current) {
      isDraggingRef.current = false;
      setTranslateX(0);
    }
  };

  // Готов к удалению, если свайп достиг порога
  const isReadyToDelete = Math.abs(translateX) >= DELETE_THRESHOLD;

  return (
    <div
      key={`exercise-set-${index}`}
      className="relative overflow-hidden rounded-[22px]"
      style={{
        height: isDeleting ? 0 : 'auto',
        marginBottom: isDeleting ? 0 : undefined,
        opacity: isDeleting ? 0 : 1,
        transition: isDeleting ? 'height 0.2s ease-out, margin 0.2s ease-out, opacity 0.2s ease-out' : 'none',
      }}
    >
      {/* Delete background */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 rounded-[22px] transition-colors ${isReadyToDelete ? 'bg-red-500' : 'bg-red-500/80'
          }`}
      >
        <div className={`flex items-center gap-2 text-white font-semibold transition-transform ${isReadyToDelete ? 'scale-110' : 'scale-100'
          }`}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span className="text-sm">Delete</span>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        className="flex gap-4 bg-[#13172A] relative z-10 select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out',
          cursor: canSwipeToDelete ? 'grab' : 'default',
        }}
        // Touch events (мобильные)
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Mouse events (компьютер)
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-center w-10 flex-col items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center border-[1px] text-[16px] font-semibold transition-colors ${isCompleted
              ? "border-emerald-400 bg-emerald-500/70 text-[#04050B]"
              : isActive
                ? "border-white bg-white text-[#05060C]"
                : "border-white/40 bg-white/10 text-white/60"
              }`}
            style={{
              clipPath:
                "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
            }}
          >
            {isCompleted ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8.5L6.5 11 12 5" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
        </div>
        <div
          className={`flex flex-1 flex-col gap-4 rounded-[22px] border px-4 py-3 shadow-inner transition-colors ${isCompleted
            ? "border-emerald-400/70 bg-emerald-600/5 text-white/60 opacity-70"
            : isActive
              ? "border-white/60 bg-[#1D2342]"
              : "border-white/10 bg-[#0F142A]/80"
            }`}
          onClick={() => {
            if (!isCompleted) {
              onActivate(index);
            }
          }}
          role="button"
          tabIndex={-1}
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reps"
              value={setEntry.reps}
              type="number"
              min={0}
              disabled={isCompleted}
              onFocus={() => onActivate(index)}
              onChange={(value) => onValueChange(index, "reps", value)}
              inputClassName="bg-[#101326]/80 border-white/40"
              wrapperClassName="w-full"
            />
            <Input
              label="Weight"
              unit={exercise.weight_unit}
              value={setEntry.weight}
              type="number"
              min={0}
              disabled={isCompleted || isBodyweight}
              placeholder={isBodyweight ? "Bodyweight" : undefined}
              onFocus={() => onActivate(index)}
              onChange={(value) => onValueChange(index, "weight", value)}
              inputClassName="bg-[#101326]/80 border-white/40"
              wrapperClassName="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
