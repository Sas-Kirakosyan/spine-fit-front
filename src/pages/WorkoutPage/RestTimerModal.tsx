import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";

const MINUTES_OPTIONS = [0, 1, 2, 3, 4, 5];
const SECONDS_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  durationMinutes: number;
  durationSeconds: number;
  onDurationChange: (minutes: number, seconds: number) => void;
  /** Таймер отдыха сейчас идёт (обратный отсчёт на странице) */
  isRestRunning?: boolean;
  /** Таймер на паузе */
  isRestPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  /** Выключить таймер (остановить отсчёт и закрыть) */
  onCancelRest?: () => void;
}

export function RestTimerModal({
  isOpen,
  onClose,
  enabled,
  onEnabledChange,
  durationMinutes,
  durationSeconds,
  onDurationChange,
  isRestRunning = false,
  isRestPaused = false,
  onPause,
  onResume,
}: RestTimerModalProps) {
  const minutesRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrollChangeRef = useRef<{ minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!isOpen || isUserScrolling) return;
    // Не вызывать scrollIntoView если изменение произошло из-за пользовательского скролла
    if (userScrollChangeRef.current &&
      userScrollChangeRef.current.minutes === durationMinutes &&
      userScrollChangeRef.current.seconds === durationSeconds) {
      userScrollChangeRef.current = null;
      return;
    }
    userScrollChangeRef.current = null;
    const scrollToSelected = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
      const element = ref.current?.querySelector(`[data-index="${index}"]`);
      element?.scrollIntoView({ block: "nearest", behavior: "auto" });
    };
    scrollToSelected(minutesRef, MINUTES_OPTIONS.indexOf(durationMinutes));
    scrollToSelected(secondsRef, SECONDS_OPTIONS.indexOf(durationSeconds));
  }, [isOpen, durationMinutes, durationSeconds, isUserScrolling]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleMinutesScroll = () => {
    if (!enabled || !minutesRef.current) return;
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);

    const container = minutesRef.current;
    const itemHeight = 44;
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, MINUTES_OPTIONS.length - 1));
    if (MINUTES_OPTIONS[clamped] !== durationMinutes) {
      userScrollChangeRef.current = { minutes: MINUTES_OPTIONS[clamped], seconds: durationSeconds };
      onDurationChange(MINUTES_OPTIONS[clamped], durationSeconds);
    }
  };

  const handleSecondsScroll = () => {
    if (!enabled || !secondsRef.current) return;
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);

    const container = secondsRef.current;
    const itemHeight = 44;
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, SECONDS_OPTIONS.length - 1));
    if (SECONDS_OPTIONS[clamped] !== durationSeconds) {
      userScrollChangeRef.current = { minutes: durationMinutes, seconds: SECONDS_OPTIONS[clamped] };
      onDurationChange(durationMinutes, SECONDS_OPTIONS[clamped]);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close rest timer modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div
        className="relative z-10 w-full max-w-[290px] rounded-[24px] border border-white/10 bg-[#0E1224] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
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
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M9 3h6" />
                <path d="M10 6h4" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Rest Timer</h2>
              <p className="text-xs text-white/60">Between sets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRestRunning && (
              <button
                type="button"
                onClick={() => (isRestPaused ? onResume?.() : onPause?.())}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-main/70"
              >
                {isRestPaused ? "Continue" : "Pause"}
              </button>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onEnabledChange(!enabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-main/70 ${enabled ? "bg-main" : "bg-white/20"
              }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ${enabled ? "left-7" : "left-1"
                }`}
            />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <div className="flex flex-col items-center">
            <span className={`mb-2 text-xs font-semibold uppercase tracking-wider ${enabled ? "text-white/50" : "text-white/20"}`}>min</span>
            <div
              ref={minutesRef}
              onScroll={enabled ? handleMinutesScroll : undefined}
              className={`scrollbar-hide h-[132px] w-20 snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-lg py-2 transition ${enabled ? "bg-white/5 cursor-pointer" : "bg-white/5 opacity-40 pointer-events-none"
                }`}
            >
              {MINUTES_OPTIONS.map((m, i) => (
                <div
                  key={m}
                  data-index={i}
                  onClick={enabled ? () => onDurationChange(m, durationSeconds) : undefined}
                  className={`flex h-11 shrink-0 items-center justify-center snap-center text-sm transition ${enabled ? "cursor-pointer" : "cursor-not-allowed"
                    } ${durationMinutes === m ? "font-semibold text-white" : "text-white/50"}`}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {m} min
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className={`mb-2 text-xs font-semibold uppercase tracking-wider ${enabled ? "text-white/50" : "text-white/20"}`}>sec</span>
            <div
              ref={secondsRef}
              onScroll={enabled ? handleSecondsScroll : undefined}
              className={`scrollbar-hide h-[132px] w-20 snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-lg py-2 transition ${enabled ? "bg-white/5 cursor-pointer" : "bg-white/5 opacity-40 pointer-events-none"
                }`}
            >
              {SECONDS_OPTIONS.map((s, i) => (
                <div
                  key={s}
                  data-index={i}
                  onClick={enabled ? () => onDurationChange(durationMinutes, s) : undefined}
                  className={`flex h-11 shrink-0 items-center justify-center snap-center text-sm transition ${enabled ? "cursor-pointer" : "cursor-not-allowed"
                    } ${durationSeconds === s ? "font-semibold text-white" : "text-white/50"}`}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {s} sec
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
