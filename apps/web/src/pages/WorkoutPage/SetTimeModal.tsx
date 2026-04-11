import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const MINUTES_OPTIONS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30,
];
const SECONDS_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_HEIGHT = 44;

interface SetTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMinutes: number;
  initialSeconds: number;
  onConfirm: (minutes: number, seconds: number) => void;
}

const snapSeconds = (value: number): number => {
  let closest = SECONDS_OPTIONS[0];
  let bestDiff = Math.abs(value - closest);
  for (const option of SECONDS_OPTIONS) {
    const diff = Math.abs(value - option);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = option;
    }
  }
  return closest;
};

const clampMinutes = (value: number): number => {
  if (value <= MINUTES_OPTIONS[0]) return MINUTES_OPTIONS[0];
  if (value >= MINUTES_OPTIONS[MINUTES_OPTIONS.length - 1])
    return MINUTES_OPTIONS[MINUTES_OPTIONS.length - 1];
  return value;
};

export function SetTimeModal({
  isOpen,
  onClose,
  initialMinutes,
  initialSeconds,
  onConfirm,
}: SetTimeModalProps) {
  const { t } = useTranslation();
  const minutesRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLDivElement>(null);
  const [minutes, setMinutes] = useState(() => clampMinutes(initialMinutes));
  const [seconds, setSeconds] = useState(() => snapSeconds(initialSeconds));
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollChangeRef = useRef<{
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMinutes(clampMinutes(initialMinutes));
    setSeconds(snapSeconds(initialSeconds));
  }, [isOpen, initialMinutes, initialSeconds]);

  useEffect(() => {
    if (!isOpen || isUserScrollingRef.current) return;
    if (
      userScrollChangeRef.current &&
      userScrollChangeRef.current.minutes === minutes &&
      userScrollChangeRef.current.seconds === seconds
    ) {
      userScrollChangeRef.current = null;
      return;
    }
    userScrollChangeRef.current = null;
    const scrollToSelected = (
      ref: React.RefObject<HTMLDivElement | null>,
      index: number
    ) => {
      const element = ref.current?.querySelector(`[data-index="${index}"]`);
      element?.scrollIntoView({ block: "nearest", behavior: "auto" });
    };
    scrollToSelected(minutesRef, MINUTES_OPTIONS.indexOf(minutes));
    scrollToSelected(secondsRef, SECONDS_OPTIONS.indexOf(seconds));
  }, [isOpen, minutes, seconds]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleMinutesScroll = () => {
    if (!minutesRef.current) return;
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);

    const index = Math.round(minutesRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MINUTES_OPTIONS.length - 1));
    const next = MINUTES_OPTIONS[clamped];
    if (next !== minutes) {
      userScrollChangeRef.current = { minutes: next, seconds };
      setMinutes(next);
    }
  };

  const handleSecondsScroll = () => {
    if (!secondsRef.current) return;
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);

    const index = Math.round(secondsRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, SECONDS_OPTIONS.length - 1));
    const next = SECONDS_OPTIONS[clamped];
    if (next !== seconds) {
      userScrollChangeRef.current = { minutes, seconds: next };
      setSeconds(next);
    }
  };

  const handleConfirm = () => {
    if (minutes === 0 && seconds === 0) {
      onClose();
      return;
    }
    onConfirm(minutes, seconds);
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close set time modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div
        className="relative z-10 w-full max-w-[290px] rounded-[24px] border border-white/10 bg-[#0E1224] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-3">
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
            </svg>
          </span>
          <h2 className="text-lg font-semibold text-white">
            {t("exerciseSetsPage.setTimeModal.title")}
          </h2>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              {t("exerciseSetsPage.restTimerModal.min")}
            </span>
            <div
              ref={minutesRef}
              onScroll={handleMinutesScroll}
              className="scrollbar-hide h-[132px] w-20 cursor-pointer snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-lg bg-white/5 py-2"
            >
              {MINUTES_OPTIONS.map((m, i) => (
                <div
                  key={m}
                  data-index={i}
                  onClick={() => setMinutes(m)}
                  className={`flex h-11 shrink-0 cursor-pointer items-center justify-center snap-center text-sm transition ${
                    minutes === m ? "font-semibold text-white" : "text-white/50"
                  }`}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {m} {t("exerciseSetsPage.restTimerModal.min")}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              {t("exerciseSetsPage.restTimerModal.sec")}
            </span>
            <div
              ref={secondsRef}
              onScroll={handleSecondsScroll}
              className="scrollbar-hide h-[132px] w-20 cursor-pointer snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-lg bg-white/5 py-2"
            >
              {SECONDS_OPTIONS.map((s, i) => (
                <div
                  key={s}
                  data-index={i}
                  onClick={() => setSeconds(s)}
                  className={`flex h-11 shrink-0 cursor-pointer items-center justify-center snap-center text-sm transition ${
                    seconds === s ? "font-semibold text-white" : "text-white/50"
                  }`}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {s} {t("exerciseSetsPage.restTimerModal.sec")}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {t("exerciseSetsPage.setTimeModal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-full border border-main bg-main text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("exerciseSetsPage.setTimeModal.ok")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
