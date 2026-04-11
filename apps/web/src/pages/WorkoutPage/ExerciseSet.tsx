import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ExerciseSetProps, ExerciseTimerStatus } from "@/types/workout";

export type { ExerciseSetRow, SetField } from "@/types/workout";

const DELETE_THRESHOLD = 150; // Порог для удаления (свайп до конца)

const CheckmarkIcon = () => (
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
);

const confirmButtonClass = (
  isCompleted: boolean,
  isWarmup: boolean,
  canLogSet: boolean,
) =>
  isCompleted
    ? isWarmup
      ? "border-amber-400 bg-amber-400 text-[#140E04]"
      : "border-[#69FF2F] bg-[#69FF2F] text-[#061404]"
    : canLogSet
      ? "border-white/20 bg-white/20 text-white hover:bg-white/30"
      : "border-white/10 bg-white/10 text-white/50";

interface SetTimerControlsProps {
  index: number;
  isCompleted: boolean;
  isWarmup: boolean;
  canLogSet: boolean;
  timerStatus: ExerciseTimerStatus;
  timeDisplay: string;
  hasTargetTime: boolean;
  canOpenTimeModal: boolean;
  onOpenTimeModal?: (index: number) => void;
  onLogSet: (index: number) => void;
  onStartTimer?: (index: number) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onConfirmTimer?: (index: number) => void;
}

const SetTimerControls: React.FC<SetTimerControlsProps> = ({
  index,
  isCompleted,
  isWarmup,
  canLogSet,
  timerStatus,
  timeDisplay,
  hasTargetTime,
  canOpenTimeModal,
  onOpenTimeModal,
  onLogSet,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onConfirmTimer,
}) => {
  const { t } = useTranslation();

  const display = canOpenTimeModal ? (
    <button
      type="button"
      onClick={() => onOpenTimeModal?.(index)}
      aria-label={`Set time for set ${index + 1}`}
      className="flex-1 text-center text-[28px] font-semibold leading-none tabular-nums text-white"
    >
      {timeDisplay}
    </button>
  ) : (
    <div
      className={`flex-1 text-center text-[28px] font-semibold leading-none tabular-nums ${
        timerStatus === "paused" ? "text-white/60" : "text-white"
      }`}
    >
      {timeDisplay}
    </div>
  );

  let controls: React.ReactNode;
  if (isCompleted) {
    controls = (
      <button
        type="button"
        onClick={() => onLogSet(index)}
        disabled={!canLogSet}
        aria-label={`Log set ${index + 1}`}
        className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-full border transition ${confirmButtonClass(isCompleted, isWarmup, canLogSet)}`}
      >
        <CheckmarkIcon />
      </button>
    );
  } else if (timerStatus === "running") {
    controls = (
      <button
        type="button"
        onClick={() => onPauseTimer?.()}
        aria-label={`Pause timer for set ${index + 1}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white transition hover:bg-white/30"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
        >
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      </button>
    );
  } else if (timerStatus === "paused") {
    controls = (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onResumeTimer?.()}
          aria-label={`Resume timer for set ${index + 1}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white transition hover:bg-white/30"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onConfirmTimer?.(index)}
          aria-label={`Confirm set ${index + 1}`}
          className="flex h-11 w-14 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white transition hover:bg-white/30"
        >
          <CheckmarkIcon />
        </button>
      </div>
    );
  } else if (hasTargetTime) {
    controls = (
      <button
        type="button"
        onClick={() => onLogSet(index)}
        disabled={!canLogSet}
        aria-label={`Log set ${index + 1}`}
        className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-full border transition ${confirmButtonClass(isCompleted, isWarmup, canLogSet)}`}
      >
        <CheckmarkIcon />
      </button>
    );
  } else {
    controls = (
      <button
        type="button"
        onClick={() => onStartTimer?.(index)}
        aria-label={`Start timer for set ${index + 1}`}
        className="flex h-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/20 px-4 text-[13px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/30"
      >
        {t("exerciseSetsPage.start")}
      </button>
    );
  }

  return (
    <div className="col-span-3 flex items-center justify-between gap-3 pr-1">
      {display}
      {controls}
    </div>
  );
};

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
  displayLabel,
  isTimeBased = false,
  timerStatus = "idle",
  timerElapsedSeconds = 0,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onConfirmTimer,
  onOpenTimeModal,
}) => {
  const { t } = useTranslation();
  const isBodyweight =
    !isTimeBased &&
    (exercise.equipment === "bodyweight" ||
      exercise.weight_unit === "bodyweight");
  const isWarmup = setEntry.type === "warmup";
  const isTimerActive = isTimeBased && !isCompleted && timerStatus !== "idle";
  const timeDisplaySeconds = isTimerActive
    ? timerElapsedSeconds
    : isTimeBased
      ? Number(setEntry.reps) || 0
      : 0;
  const hasTargetTime = isTimeBased && Number(setEntry.reps) > 0;
  const canOpenTimeModal =
    isTimeBased && !isCompleted && timerStatus === "idle" && !!onOpenTimeModal;
  const timeMins = Math.floor(timeDisplaySeconds / 60);
  const timeSecs = timeDisplaySeconds % 60;
  const timeDisplay = `${timeMins.toString().padStart(2, "0")}:${timeSecs
    .toString()
    .padStart(2, "0")}`;
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const deleteCalledRef = useRef(false);

  // Можно удалить только если: есть возможность удаления И сет не выполнен
  const canSwipeToDelete = canDelete && !isCompleted;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Не блокировать тач на интерактивных элементах (INPUT, LABEL, BUTTON)
    const targetTag = (e.target as HTMLElement).tagName;
    if (
      targetTag === "INPUT" ||
      targetTag === "LABEL" ||
      targetTag === "BUTTON"
    )
      return;
    if (!canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      !isDraggingRef.current ||
      !canSwipeToDelete ||
      isDeleting ||
      deleteCalledRef.current
    )
      return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Только свайп влево (отрицательные значения)
    const newTranslate = Math.min(0, diff);
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    if (
      !isDraggingRef.current ||
      !canSwipeToDelete ||
      isDeleting ||
      deleteCalledRef.current
    )
      return;
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
    // Не блокировать клики на интерактивных элементах (INPUT, LABEL, BUTTON)
    if (
      targetTag === "INPUT" ||
      targetTag === "LABEL" ||
      targetTag === "BUTTON"
    ) {
      return;
    }
    if (!canSwipeToDelete || isDeleting || deleteCalledRef.current) return;
    e.preventDefault();
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !isDraggingRef.current ||
      !canSwipeToDelete ||
      isDeleting ||
      deleteCalledRef.current
    )
      return;
    const diff = e.clientX - startXRef.current;
    const newTranslate = Math.min(0, diff);
    setTranslateX(newTranslate);
  };

  const handleMouseUp = () => {
    if (
      !isDraggingRef.current ||
      !canSwipeToDelete ||
      isDeleting ||
      deleteCalledRef.current
    )
      return;
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
        height: isDeleting ? 0 : "auto",
        marginBottom: isDeleting ? 0 : undefined,
        opacity: isDeleting ? 0 : 1,
        transition: isDeleting
          ? "height 0.2s ease-out, margin 0.2s ease-out, opacity 0.2s ease-out"
          : "none",
      }}
    >
      {/* Delete background */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 rounded-[22px] transition-colors ${
          isReadyToDelete ? "bg-red-500" : "bg-red-500/80"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-white font-semibold transition-transform ${
            isReadyToDelete ? "scale-110" : "scale-100"
          }`}
        >
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
          <span className="text-sm">{t("exerciseSetsPage.swipeDelete")}</span>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        className={`relative z-10 grid select-none grid-cols-[44px_minmax(0,1fr)_68px_68px_52px] items-center gap-2 rounded-[14px] px-2.5 py-2 transition-colors ${
          isCompleted
            ? isWarmup
              ? "bg-[#3A3A05]"
              : "bg-[#0F4A05]"
            : isActive
              ? isWarmup
                ? "bg-[#1F1A14]"
                : "bg-[#171C2F]"
              : isWarmup
                ? "bg-[#161210]"
                : "bg-[#0E1326]"
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current
            ? "none"
            : "transform 0.3s ease-out",
          cursor: canSwipeToDelete ? "grab" : "default",
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
        <div
          className={`justify-self-center text-center font-semibold leading-none tabular-nums ${
            isWarmup
              ? "text-[20px] text-amber-400/80"
              : "text-[30px] text-main/90"
          }`}
        >
          {displayLabel ?? index + 1}
        </div>
        <div className="w-full truncate pr-1 text-left text-[15px] font-medium text-white/70">
          {previousValue}
        </div>
        {isTimeBased ? (
          <SetTimerControls
            index={index}
            isCompleted={isCompleted}
            isWarmup={isWarmup}
            canLogSet={canLogSet}
            timerStatus={timerStatus}
            timeDisplay={timeDisplay}
            hasTargetTime={hasTargetTime}
            canOpenTimeModal={canOpenTimeModal}
            onOpenTimeModal={onOpenTimeModal}
            onLogSet={onLogSet}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
            onConfirmTimer={onConfirmTimer}
          />
        ) : (
          <>
            <input
              value={setEntry.weight}
              type="number"
              min={0}
              disabled={isCompleted || isBodyweight}
              placeholder={isBodyweight ? "-" : "0"}
              onFocus={() => onActivate(index)}
              onChange={(event) =>
                onValueChange(index, "weight", event.target.value)
              }
              className="h-9 w-full [appearance:textfield] rounded-[8px] border border-transparent bg-transparent px-1 text-center text-[26px] font-semibold leading-none text-white tabular-nums outline-none transition-colors placeholder:text-white/25 focus:border-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              value={setEntry.reps}
              type="number"
              min={0}
              disabled={isCompleted}
              placeholder="0"
              onFocus={() => onActivate(index)}
              onChange={(event) =>
                onValueChange(index, "reps", event.target.value)
              }
              className="h-9 w-full [appearance:textfield] rounded-[8px] border border-transparent bg-transparent px-1 text-center text-[26px] font-semibold leading-none text-white tabular-nums outline-none transition-colors placeholder:text-white/25 focus:border-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onLogSet(index)}
              disabled={!canLogSet}
              aria-label={`Log set ${index + 1}`}
              className={`justify-self-center flex h-11 w-14 ml-4 items-center justify-center rounded-full border transition ${confirmButtonClass(isCompleted, isWarmup, canLogSet)}`}
            >
              <CheckmarkIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
