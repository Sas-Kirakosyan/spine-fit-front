import { useState, useEffect, useCallback } from "react";
import { formatTime } from "@/utils/date";

interface UseWorkoutTimerOptions {
  initialStartTime?: number | null;
  isPaused?: boolean;
}

interface UseWorkoutTimerReturn {
  elapsedSeconds: number;
  formattedTime: string;
  adjustedStartTime: number | null;
  resetToElapsed: (elapsedSeconds: number) => void;
}

export function useWorkoutTimer({
  initialStartTime = null,
  isPaused = false,
}: UseWorkoutTimerOptions = {}): UseWorkoutTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (initialStartTime) {
      return Math.floor((Date.now() - initialStartTime) / 1000);
    }
    return 0;
  });

  const [adjustedStartTime, setAdjustedStartTime] = useState<number | null>(
    initialStartTime
  );

  // Sync with external start time changes
  useEffect(() => {
    if (initialStartTime) {
      setAdjustedStartTime(initialStartTime);
      const elapsed = Math.floor((Date.now() - initialStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }
  }, [initialStartTime]);

  // Timer interval
  useEffect(() => {
    const effectiveStartTime = adjustedStartTime || initialStartTime;

    if (!effectiveStartTime || isPaused) {
      return;
    }

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    // Set initial elapsed time immediately
    const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
    setElapsedSeconds(elapsed);

    return () => {
      clearInterval(intervalId);
    };
  }, [adjustedStartTime, initialStartTime, isPaused]);

  const resetToElapsed = useCallback((pausedElapsedSeconds: number) => {
    const newStartTime = Date.now() - pausedElapsedSeconds * 1000;
    setAdjustedStartTime(newStartTime);
  }, []);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    adjustedStartTime,
    resetToElapsed,
  };
}
