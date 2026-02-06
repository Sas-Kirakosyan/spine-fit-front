import { useMemo } from "react";
import type { ExerciseProgress } from "@/utils/progressStats";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ExerciseItemProps {
  exercise: ExerciseProgress;
}

function MiniProgressChart({ data }: { data: Array<{ date: string; value: number }> }) {
  const chartData = useMemo(() => {
    // Take last 10 data points for mini chart
    const recent = data.slice(-10);
    return recent.map((point) => ({
      value: point.value,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-12 w-20 flex items-center justify-center text-slate-600 text-xs">
        No data
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="h-12 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <XAxis hide />
          <YAxis hide domain={[minValue - range * 0.1, maxValue + range * 0.1]} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExerciseItem({ exercise }: ExerciseItemProps) {
  const hasImprovement = useMemo(() => {
    if (exercise.progressData.length < 2) return false;
    const sorted = [...exercise.progressData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = sorted[0].value;
    const last = sorted[sorted.length - 1].value;
    return last > first;
  }, [exercise.progressData]);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#1B1E2B]/80 p-3 ring-1 ring-white/5 hover:ring-white/10 transition-all cursor-pointer">
      {/* Exercise icon/image */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-700/50 overflow-hidden flex items-center justify-center">
        {exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.exerciseName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                    <path d="m6.5 6.5 11 11" />
                    <path d="m21 21-1-1" />
                    <path d="m3 3 1 1" />
                    <path d="m18 22 4-4" />
                    <path d="m2 6 4-4" />
                    <path d="m3 10 7-7" />
                    <path d="m14 21 7-7" />
                  </svg>
                `;
              }
            }}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          >
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1" />
            <path d="m3 3 1 1" />
            <path d="m18 22 4-4" />
            <path d="m2 6 4-4" />
            <path d="m3 10 7-7" />
            <path d="m14 21 7-7" />
          </svg>
        )}
      </div>

      {/* Exercise info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">
          {exercise.exerciseName}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">
            Est 1RM. {Math.round(exercise.estimated1RM)}kg
          </span>
          {hasImprovement && exercise.currentBest1RM > 0 && (
            <span className="text-xs text-green-400">
              ~ {Math.round(exercise.currentBest1RM)}kg
            </span>
          )}
        </div>
      </div>

      {/* Progress chart */}
      <MiniProgressChart data={exercise.progressData} />
    </div>
  );
}
