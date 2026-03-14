import type { WeeklyActivityDay } from "@/utils/progressStats";

interface WeeklyActivityProps {
  days: WeeklyActivityDay[];
}

export function WeeklyActivity({ days }: WeeklyActivityProps) {
  return (
    <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
        Weekly Activity
      </h3>
      <div className="flex items-center justify-between gap-2">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${day.hasWorkout
                ? "bg-main text-white shadow-lg shadow-main/30"
                : "bg-slate-700/50 text-slate-500"
                }`}
            >
              {day.hasWorkout ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-xs">-</span>
              )}
            </div>
            <span
              className={`text-xs font-medium ${day.hasWorkout ? "text-white" : "text-slate-500"
                }`}
            >
              {day.dayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
