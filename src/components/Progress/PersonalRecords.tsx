import type { PersonalRecord, WorkoutRecord } from "@/utils/progressStats";

type PersonalRecordsSection = "all" | "workoutOnly" | "exerciseOnly";

interface PersonalRecordsProps {
  exerciseRecords: PersonalRecord[];
  workoutRecords: WorkoutRecord[];
  maxItems?: number;
  /** Show only workout records, only exercise records, or both (default: "all") */
  section?: PersonalRecordsSection;
}

function TrophyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function MedalIcon({ place }: { place: number }) {
  const colors = {
    1: "text-yellow-400",
    2: "text-slate-300",
    3: "text-amber-600",
  };
  return (
    <span
      className={`text-lg font-bold ${colors[place as keyof typeof colors] || "text-slate-400"}`}
    >
      #{place}
    </span>
  );
}

export function PersonalRecords({
  exerciseRecords,
  workoutRecords,
  maxItems = 5,
  section = "all",
}: PersonalRecordsProps) {
  const topExercises = exerciseRecords.slice(0, maxItems);
  const showWorkoutRecords = (section === "all" || section === "workoutOnly") && workoutRecords.length > 0;
  const showExerciseRecords = (section === "all" || section === "exerciseOnly") && topExercises.length > 0;
  const showEmptyState =
    (section === "all" && exerciseRecords.length === 0 && workoutRecords.length === 0) ||
    (section === "workoutOnly" && workoutRecords.length === 0) ||
    (section === "exerciseOnly" && exerciseRecords.length === 0);

  return (
    <div className="flex flex-col gap-4">
      {showWorkoutRecords && (
        <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-yellow-400">
              <TrophyIcon />
            </span>
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Workout records
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {workoutRecords.map((record, index) => (
              <div
                key={index}
                className="rounded-lg bg-[#111427]/80 p-3 text-center"
              >
                <p className="text-xs text-slate-400">{record.label}</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {record.type === "volume"
                    ? `${(record.value / 1000).toFixed(1)}K`
                    : record.value}
                </p>
                <p className="text-[10px] text-slate-500">
                  {record.type === "volume" ? "kg" : "exercises"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExerciseRecords && (
        <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
            Estimated 1RM (Top {maxItems})
          </h3>
          <div className="flex flex-col gap-2">
            {topExercises.map((record, index) => (
              <div
                key={record.exerciseId}
                className="flex items-center gap-3 rounded-lg bg-[#111427]/80 p-3"
              >
                <MedalIcon place={index + 1} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {record.exerciseName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Best set: {record.bestWeight}kg × {record.bestReps}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-main">
                    {Math.round(record.estimated1RM)}
                  </p>
                  <p className="text-[10px] text-slate-500">kg 1RM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-[14px] bg-[#1B1E2B]/80 p-6 ring-1 ring-white/5 text-center">
          <span className="text-4xl mb-2 block text-slate-600">
            <TrophyIcon />
          </span>
          <p className="text-sm text-slate-400">
            {section === "exerciseOnly"
              ? "Your estimated 1RM by exercise will appear here after completed workouts."
              : "Complete workouts to see your personal records"}
          </p>
        </div>
      )}
    </div>
  );
}
