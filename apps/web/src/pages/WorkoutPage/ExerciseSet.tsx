import { useState, useRef } from "react";
import type { ExerciseSetProps } from "@/types/workout";

export type { ExerciseSetRow, SetField } from "@/types/workout";

const DELETE_THRESHOLD = 150; // Порог для удаления (свайп до конца)

export const ExerciseSet: React.FC<ExerciseSetProps> = ({
  index,
  setEntry,
  exercise,
  previousValue,
  isActive,
  isCompleted,
  canDelete,
  canLogSet,
  onActivate,
  onValueChange,
  onLogSet,
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
        className={`relative z-10 grid select-none grid-cols-[44px_minmax(0,1fr)_68px_68px_52px] items-center gap-2 rounded-[14px] px-2.5 py-2 transition-colors ${
          isCompleted ? "bg-[#0F4A05]" : isActive ? "bg-[#171C2F]" : "bg-[#0E1326]"
        }`}
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
        <div className="justify-self-center text-center text-[30px] font-semibold leading-none text-main/90 tabular-nums">
          {index + 1}
        </div>
        <div className="w-full truncate pr-1 text-left text-[15px] font-medium text-white/70">
          {previousValue}
        </div>
        <input
          value={setEntry.weight}
          type="number"
          min={0}
          disabled={isCompleted || isBodyweight}
          placeholder={isBodyweight ? "-" : "0"}
          onFocus={() => onActivate(index)}
          onChange={(event) => onValueChange(index, "weight", event.target.value)}
          className="h-9 w-full [appearance:textfield] rounded-[8px] border border-transparent bg-transparent px-1 text-center text-[26px] font-semibold leading-none text-white tabular-nums outline-none transition-colors placeholder:text-white/25 focus:border-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <input
          value={setEntry.reps}
          type="number"
          min={0}
          disabled={isCompleted}
          placeholder="0"
          onFocus={() => onActivate(index)}
          onChange={(event) => onValueChange(index, "reps", event.target.value)}
          className="h-9 w-full [appearance:textfield] rounded-[8px] border border-transparent bg-transparent px-1 text-center text-[26px] font-semibold leading-none text-white tabular-nums outline-none transition-colors placeholder:text-white/25 focus:border-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onLogSet(index)}
          disabled={!canLogSet}
          aria-label={`Log set ${index + 1}`}
          className={`justify-self-center flex h-11 w-14 ml-4 items-center justify-center rounded-full border transition ${
            isCompleted
              ? "border-[#69FF2F] bg-[#69FF2F] text-[#061404]"
              : canLogSet
                ? "border-white/20 bg-white/20 text-white hover:bg-white/30"
                : "border-white/10 bg-white/10 text-white/50"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.2 4.2L19 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};
