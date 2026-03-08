import { useMemo, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { ExerciseProgressPageProps } from "@/types/pages";
import { getExerciseEstimated1RM, calculate1RM } from "@/utils/oneRepMax";
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
      (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    );

    sorted.forEach((workout) => {
      const exercise = workout.completedExercises.find((ex) => ex.id === exerciseId);
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

interface RecordEntry {
  value: number;
  date: string;
  weight: number;
  reps: number;
  setCount?: number;
}

interface PersonalRecords {
  estimated1RM: RecordEntry | null;
  maxWeight: RecordEntry | null;
  maxReps: RecordEntry | null;
  maxSessionVolume: RecordEntry | null;
  maxSingleSetVolume: RecordEntry | null;
}

interface RecordHistory {
  estimated1RMs: RecordEntry[];
  maxWeights: RecordEntry[];
  maxReps: RecordEntry[];
  maxSessionVolumes: RecordEntry[];
  maxSingleSetVolumes: RecordEntry[];
}

function usePersonalRecords(sessions: ExerciseSession[]) {
  return useMemo(() => {
    const records: PersonalRecords = {
      estimated1RM: null,
      maxWeight: null,
      maxReps: null,
      maxSessionVolume: null,
      maxSingleSetVolume: null,
    };

    const history: RecordHistory = {
      estimated1RMs: [],
      maxWeights: [],
      maxReps: [],
      maxSessionVolumes: [],
      maxSingleSetVolumes: [],
    };

    let best1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;
    let bestSessionVolume = 0;
    let bestSingleSetVolume = 0;

    const chronological = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    chronological.forEach((session) => {
      const completedSets = session.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return;

      if (session.estimated1RM > best1RM) {
        best1RM = session.estimated1RM;
        const bestSet = completedSets.reduce((best, set) => {
          return calculate1RM(set.weight, set.reps) > calculate1RM(best.weight, best.reps)
            ? set
            : best;
        }, completedSets[0]);
        const entry: RecordEntry = {
          value: Math.round(session.estimated1RM),
          date: session.date,
          weight: bestSet.weight,
          reps: bestSet.reps,
        };
        records.estimated1RM = entry;
        history.estimated1RMs.push(entry);
      }

      completedSets.forEach((set) => {
        if (set.weight > bestWeight) {
          bestWeight = set.weight;
          const entry: RecordEntry = {
            value: set.weight,
            date: session.date,
            weight: set.weight,
            reps: set.reps,
          };
          records.maxWeight = entry;
          history.maxWeights.push(entry);
        }
      });

      completedSets.forEach((set) => {
        if (set.reps > bestReps) {
          bestReps = set.reps;
          const entry: RecordEntry = {
            value: set.reps,
            date: session.date,
            weight: set.weight,
            reps: set.reps,
          };
          records.maxReps = entry;
          history.maxReps.push(entry);
        }
      });

      if (session.sessionVolume > bestSessionVolume) {
        bestSessionVolume = session.sessionVolume;
        const entry: RecordEntry = {
          value: session.sessionVolume,
          date: session.date,
          weight: 0,
          reps: 0,
          setCount: completedSets.length,
        };
        records.maxSessionVolume = entry;
        history.maxSessionVolumes.push(entry);
      }

      completedSets.forEach((set) => {
        const setVolume = set.weight * set.reps;
        if (setVolume > bestSingleSetVolume) {
          bestSingleSetVolume = setVolume;
          const entry: RecordEntry = {
            value: setVolume,
            date: session.date,
            weight: set.weight,
            reps: set.reps,
          };
          records.maxSingleSetVolume = entry;
          history.maxSingleSetVolumes.push(entry);
        }
      });
    });

    history.estimated1RMs.reverse();
    history.maxWeights.reverse();
    history.maxReps.reverse();
    history.maxSessionVolumes.reverse();
    history.maxSingleSetVolumes.reverse();

    return { records, history };
  }, [sessions]);
}

function formatRecordDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PRBadge() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
        <span className="text-[10px] font-black text-black tracking-tight">PR</span>
      </div>
    </div>
  );
}

function RecordCard({
  label,
  record,
  unit,
  detail,
}: {
  label: string;
  record: RecordEntry | null;
  unit: string;
  detail: string;
}) {
  if (!record) return null;
  return (
    <div className="flex items-center gap-3 py-4 border-b border-white/5 last:border-b-0">
      <PRBadge />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-400">{formatRecordDate(record.date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold text-white">
          {typeof record.value === "number" && record.value % 1 !== 0
            ? record.value.toFixed(1)
            : record.value}
          {unit}
        </p>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function RecordsTab({
  sessions,
  exerciseName,
  onViewHistory,
}: {
  sessions: ExerciseSession[];
  exerciseName: string;
  onViewHistory: () => void;
}) {
  const { records } = usePersonalRecords(sessions);

  if (sessions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
        <p className="text-sm text-slate-400">No records yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      <div>
        <h2 className="text-xl font-bold text-white">Personal Records</h2>
        <p className="text-sm text-slate-400 mt-1">
          See your best lifts for {exerciseName}
        </p>
      </div>

      <div className="flex flex-col">
        <RecordCard
          label="Estimated 1RM"
          record={records.estimated1RM}
          unit="kg"
          detail={
            records.estimated1RM
              ? `${records.estimated1RM.weight}kg x ${records.estimated1RM.reps} reps`
              : ""
          }
        />
        <RecordCard
          label="Max weight"
          record={records.maxWeight}
          unit="kg"
          detail={
            records.maxWeight
              ? `${records.maxWeight.weight}kg x ${records.maxWeight.reps} reps`
              : ""
          }
        />
        <RecordCard
          label="Max reps"
          record={records.maxReps}
          unit=""
          detail={
            records.maxReps
              ? `${records.maxReps.weight}kg x ${records.maxReps.reps} reps`
              : ""
          }
        />
        <RecordCard
          label="Max session Volume"
          record={records.maxSessionVolume}
          unit="kg"
          detail={
            records.maxSessionVolume
              ? `${records.maxSessionVolume.setCount} Sets`
              : ""
          }
        />
        <RecordCard
          label="Max Single Set Volume"
          record={records.maxSingleSetVolume}
          unit="kg"
          detail={
            records.maxSingleSetVolume
              ? `${records.maxSingleSetVolume.weight}kg x ${records.maxSingleSetVolume.reps} reps`
              : ""
          }
        />
      </div>

      <button
        type="button"
        onClick={onViewHistory}
        className="w-full mt-2 py-3.5 rounded-full bg-white text-black text-sm font-semibold transition-colors hover:bg-white/90 cursor-pointer"
      >
        View Record History
      </button>
    </div>
  );
}

function RecordHistorySection({
  title,
  entries,
  unit,
  formatValue,
}: {
  title: string;
  entries: RecordEntry[];
  unit: string;
  formatValue?: (entry: RecordEntry) => string;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-col">
        {entries.map((entry, idx) => {
          const displayValue = formatValue
            ? formatValue(entry)
            : `${entry.value % 1 !== 0 ? entry.value.toFixed(1) : entry.value}${unit}`;
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
            >
              <p className="text-base font-semibold text-white">{displayValue}</p>
              <p className="text-sm text-slate-400">{formatRecordDate(entry.date)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecordHistoryView({
  sessions,
  exerciseName,
  onBack,
}: {
  sessions: ExerciseSession[];
  exerciseName: string;
  onBack: () => void;
}) {
  const { history } = usePersonalRecords(sessions);

  return (
    <PageContainer contentClassName="pb-8">
      <header className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
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
        <h1 className="text-lg font-semibold text-white">{exerciseName}</h1>
      </header>

      <div className="px-4 mt-2">
        <RecordHistorySection
          title="Estimated 1RM"
          entries={history.estimated1RMs}
          unit="kg"
        />
        <RecordHistorySection
          title="Max weight"
          entries={history.maxWeights}
          unit="kg"
        />
        <RecordHistorySection
          title="Max reps"
          entries={history.maxReps}
          unit=""
          formatValue={(e) => `${e.value}`}
        />
        <RecordHistorySection
          title="Max session Volume"
          entries={history.maxSessionVolumes}
          unit="kg"
        />
        <RecordHistorySection
          title="Max Single Set Volume"
          entries={history.maxSingleSetVolumes}
          unit="kg"
        />
      </div>
    </PageContainer>
  );
}

interface SetPR {
  isPR: boolean;
  diff: number;
}

function calculateSetRecords(
  sessions: ExerciseSession[],
): Map<string, Map<number, SetPR>> {
  const chronological = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const bestByReps = new Map<number, number>();
  const result = new Map<string, Map<number, SetPR>>();

  chronological.forEach((session) => {
    const sessionPRs = new Map<number, SetPR>();
    session.sets
      .filter((s) => s.completed)
      .forEach((set, idx) => {
        const prevBest = bestByReps.get(set.reps) ?? 0;
        if (set.weight > prevBest && set.weight > 0) {
          sessionPRs.set(idx, {
            isPR: true,
            diff: prevBest > 0 ? set.weight - prevBest : 0,
          });
          bestByReps.set(set.reps, set.weight);
        }
      });
    result.set(session.workoutId, sessionPRs);
  });

  return result;
}

function HistoryTab({ sessions }: { sessions: ExerciseSession[] }) {
  const setRecords = useMemo(() => calculateSetRecords(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
        <p className="text-sm text-slate-400">No history yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sessions.map((session) => (
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
              <p className="text-xs text-slate-400">{formatDateTime(session.date)}</p>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Sets Performed
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {session.sets
              .filter((s) => s.completed)
              .map((set, idx) => {
                const pr = setRecords.get(session.workoutId)?.get(idx);
                return (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-main font-semibold w-4">{idx + 1}</span>
                      <span className="text-sm font-medium text-white">
                        {set.weight}kg x {set.reps} reps
                      </span>
                    </div>
                    {pr?.isPR && (
                      <span className="text-xs font-semibold text-green-400">
                        PR{pr.diff > 0 ? ` +${pr.diff}kg` : ""}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderChartTooltip(unit: string, formatFn?: (v: number) => string) {
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
  const reversedSessions = useMemo(() => [...sessions].reverse(), [sessions]);

  const latest1RM = sessions.length > 0 ? sessions[0].estimated1RM : 0;
  const latestDate = sessions.length > 0 ? sessions[0].date : "";
  const latestVolume = sessions.length > 0 ? sessions[0].sessionVolume : 0;

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
          <h3 className="text-base font-semibold text-white">Estimated Strength</h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {Math.round(latest1RM)}
          <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strengthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
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
                activeDot={{
                  fill: "#3b82f6",
                  stroke: "#fff",
                  strokeWidth: 2,
                  r: 7,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Volume card */}
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white">Session Volume</h3>
        </div>
        <p className="text-3xl font-bold text-white">
          {formatVolume(latestVolume)}
          <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">{formatDate(latestDate)}</p>

        <div className="h-[200px] w-full outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
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

        <div className="h-[200px] w-full outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={maxWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
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
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ fill: "#7c3aed", r: 5, strokeWidth: 0 }}
                activeDot={{
                  fill: "#7c3aed",
                  stroke: "#fff",
                  strokeWidth: 2,
                  r: 7,
                }}
              />
            </LineChart>
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

        <div className="h-[200px] w-full outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={maxRepsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2}
                dot={{ fill: "#059669", r: 5, strokeWidth: 0 }}
                activeDot={{
                  fill: "#059669",
                  stroke: "#fff",
                  strokeWidth: 2,
                  r: 7,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ExerciseProgressPage({
  exerciseId,
  onNavigateBack,
  workoutHistory,
}: ExerciseProgressPageProps) {
  const [activeTab, setActiveTab] = useState<"history" | "progress" | "records">("history");
  const [showRecordHistory, setShowRecordHistory] = useState(false);
  const { sessions, exerciseName } = useExerciseHistory(exerciseId, workoutHistory);

  if (showRecordHistory) {
    return (
      <RecordHistoryView
        sessions={sessions}
        exerciseName={exerciseName || "Exercise"}
        onBack={() => setShowRecordHistory(false)}
      />
    );
  }

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
      <nav className="flex border-b border-white/10 px-4" aria-label="Exercise sections">
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
        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "records"
              ? "border-main text-white"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Records
        </button>
      </nav>

      {/* Tab content */}
      <div className="px-4 mt-4">
        {activeTab === "history" && <HistoryTab sessions={sessions} />}
        {activeTab === "progress" && <ProgressTab sessions={sessions} />}
        {activeTab === "records" && (
          <RecordsTab
            sessions={sessions}
            exerciseName={exerciseName || "Exercise"}
            onViewHistory={() => setShowRecordHistory(true)}
          />
        )}
      </div>
    </PageContainer>
  );
}

export default ExerciseProgressPage;
