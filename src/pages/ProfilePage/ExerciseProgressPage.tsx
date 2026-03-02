import { useMemo, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { ExerciseProgressPageProps } from "@/types/pages";
import { getExerciseEstimated1RM } from "@/utils/oneRepMax";
import { formatVolume } from "@/utils/progressStats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ExerciseSession {
  workoutId: string;
  date: string;
  sets: Array<{ weight: number; reps: number; completed: boolean }>;
  estimated1RM: number;
  sessionVolume: number;
}

function useExerciseHistory(
  exerciseId: number,
  workoutHistory: ExerciseProgressPageProps["workoutHistory"]
) {
  return useMemo(() => {
    const sessions: ExerciseSession[] = [];
    let exerciseName = "";

    const sorted = [...workoutHistory].sort(
      (a, b) =>
        new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    );

    sorted.forEach((workout) => {
      const exercise = workout.completedExercises.find(
        (ex) => ex.id === exerciseId
      );
      if (!exercise) return;

      if (!exerciseName) exerciseName = exercise.name;

      const logs = workout.completedExerciseLogs[exerciseId] || [];
      if (logs.length === 0) return;

      const sets = logs.map((set) => ({
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
        completed: set.completed,
      }));

      const estimated1RM = getExerciseEstimated1RM(logs);
      const sessionVolume = sets.reduce(
        (sum, s) => (s.completed ? sum + s.weight * s.reps : sum),
        0
      );

      sessions.push({
        workoutId: workout.id,
        date: workout.finishedAt,
        sets,
        estimated1RM,
        sessionVolume,
      });
    });

    return { sessions, exerciseName };
  }, [exerciseId, workoutHistory]);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function HistoryTab({
  sessions,
}: {
  sessions: ExerciseSession[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
        <p className="text-sm text-slate-400">No history yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sessions.map((session) => {
        const bestSet = session.sets.reduce(
          (best, s) => {
            if (s.weight > best.weight) return s;
            return best;
          },
          { weight: 0, reps: 0, completed: false }
        );

        return (
          <div
            key={session.workoutId}
            className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/50 text-sm font-bold text-purple-300">
                Fb
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Workout</h3>
                <p className="text-xs text-slate-400">
                  {formatDateTime(session.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Sets Performed
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                1RM
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {session.sets
                .filter((s) => s.completed)
                .map((set, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-main font-semibold w-4">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {set.weight}kg x {set.reps} reps
                      </span>
                      {set.weight === bestSet.weight &&
                        set.reps === bestSet.reps &&
                        idx ===
                          session.sets
                            .filter((s) => s.completed)
                            .findIndex(
                              (s) =>
                                s.weight === bestSet.weight &&
                                s.reps === bestSet.reps
                            ) && (
                          <span className="text-xs text-yellow-400">🏅 1RM</span>
                        )}
                    </div>
                    <span className="text-sm text-slate-300">
                      {Math.round(session.estimated1RM)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderChartTooltip(unit: string, formatFn?: (v: number) => string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const val = payload[0].value as number;
      const display = formatFn ? formatFn(val) : `${Math.round(val)}`;
      return (
        <div className="rounded-lg bg-[#1B1E2B] px-3 py-2 shadow-xl ring-1 ring-white/10">
          <p className="text-sm font-semibold text-white">
            {display} {unit}
          </p>
        </div>
      );
    }
    return null;
  };
}

function ProgressTab({ sessions }: { sessions: ExerciseSession[] }) {
  const reversedSessions = useMemo(
    () => [...sessions].reverse(),
    [sessions]
  );

  const latest1RM = sessions.length > 0 ? sessions[0].estimated1RM : 0;
  const latestDate = sessions.length > 0 ? sessions[0].date : "";
  const latestVolume =
    sessions.length > 0 ? sessions[0].sessionVolume : 0;

  const getSessionMaxWeight = (s: ExerciseSession) =>
    s.sets.filter((x) => x.completed).reduce((m, x) => Math.max(m, x.weight), 0);

  const getSessionMaxReps = (s: ExerciseSession) =>
    s.sets.filter((x) => x.completed).reduce((m, x) => Math.max(m, x.reps), 0);

  const latestMaxWeight = sessions.length > 0 ? getSessionMaxWeight(sessions[0]) : 0;
  const latestMaxReps = sessions.length > 0 ? getSessionMaxReps(sessions[0]) : 0;

  const strengthData = useMemo(
    () =>
      reversedSessions.map((s) => ({
        date: formatShortDate(s.date),
        value: Math.round(s.estimated1RM),
      })),
    [reversedSessions]
  );

  const volumeData = useMemo(
    () =>
      reversedSessions.map((s) => ({
        date: formatShortDate(s.date),
        value: Math.round(s.sessionVolume),
      })),
    [reversedSessions]
  );

  const maxWeightData = useMemo(
    () =>
      reversedSessions.map((s) => ({
        date: formatShortDate(s.date),
        value: getSessionMaxWeight(s),
      })),
    [reversedSessions]
  );

  const maxRepsData = useMemo(
    () =>
      reversedSessions.map((s) => ({
        date: formatShortDate(s.date),
        value: getSessionMaxReps(s),
      })),
    [reversedSessions]
  );

  if (sessions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
        <p className="text-sm text-slate-400">No progress data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Estimated Strength card */}
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white">
            Estimated Strength
          </h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {Math.round(latest1RM)}
          <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={strengthData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={35}
              />
              <Tooltip cursor={false} content={renderChartTooltip("kg")} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 5, strokeWidth: 0 }}
                activeDot={{ fill: "#3b82f6", stroke: "#fff", strokeWidth: 2, r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Volume card */}
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white">
            Session Volume
          </h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {formatVolume(latestVolume)}
          <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => formatVolume(v)}
                width={40}
              />
              <Tooltip cursor={false} content={renderChartTooltip("kg", (v) => formatVolume(v))} />
              <Bar dataKey="value" fill="#1e5a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Max Weight card */}
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white">Max Weight</h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {latestMaxWeight}
          <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={maxWeightData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={35}
              />
              <Tooltip cursor={false} content={renderChartTooltip("kg")} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Max Reps card */}
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white">Max Reps</h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {latestMaxReps}
          <span className="text-lg font-normal text-slate-400">reps</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={maxRepsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={30}
              />
              <Tooltip cursor={false} content={renderChartTooltip("reps")} />
              <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function ExerciseProgressPage({
  exerciseId,
  onNavigateBack,
  workoutHistory,
}: ExerciseProgressPageProps) {
  const [activeTab, setActiveTab] = useState<"history" | "progress">(
    "history"
  );
  const { sessions, exerciseName } = useExerciseHistory(
    exerciseId,
    workoutHistory
  );

  return (
    <PageContainer contentClassName="pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={onNavigateBack}
          className="flex items-center justify-center rounded-full p-1 text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
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
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white flex-1 text-center mr-8">
          {exerciseName || "Exercise"}
        </h1>
        <button
          type="button"
          className="flex items-center justify-center rounded-full p-1 text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </header>

      {/* Tabs */}
      <nav
        className="flex border-b border-white/10 px-4"
        aria-label="Exercise sections"
      >
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "history"
              ? "border-main text-white"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("progress")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "progress"
              ? "border-main text-white"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Progress
        </button>
      </nav>

      {/* Tab content */}
      <div className="px-4 mt-4">
        {activeTab === "history" ? (
          <HistoryTab sessions={sessions} />
        ) : (
          <ProgressTab sessions={sessions} />
        )}
      </div>
    </PageContainer>
  );
}
