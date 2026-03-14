import { useState, useEffect, useRef } from "react";
import { formatTime } from "@spinefit/shared";

interface UseWorkoutTimerProps {
  initialStartTime?: number;
  isPaused?: boolean;
}

export function useWorkoutTimer({ initialStartTime, isPaused = false }: UseWorkoutTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(initialStartTime ?? null);

  useEffect(() => {
    if (initialStartTime) {
      startTimeRef.current = initialStartTime;
    }
  }, [initialStartTime]);

  useEffect(() => {
    if (!startTimeRef.current || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current!) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const formattedTime = formatTime(elapsedSeconds);

  const resetToElapsed = (seconds: number) => {
    startTimeRef.current = Date.now() - seconds * 1000;
    setElapsedSeconds(seconds);
  };

  return {
    elapsedSeconds,
    formattedTime,
    adjustedStartTime: startTimeRef.current,
    resetToElapsed,
  };
}
