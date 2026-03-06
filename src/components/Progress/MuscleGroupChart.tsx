import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { MuscleGroupData } from "@/utils/progressStats";

const CATEGORY_COLORS: Record<string, string> = {
  Legs: "#e77d10",
  Back: "#3b82f6",
  Chest: "#ef4444",
  Shoulders: "#a855f7",
  Arms: "#22c55e",
  Core: "#eab308",
  Other: "#64748b",
};

interface MuscleGroupChartProps {
  data: MuscleGroupData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MuscleGroupData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-lg bg-[#1B1E2B] px-3 py-2 shadow-xl ring-1 ring-white/10">
        <p className="text-sm font-semibold text-white">{d.name}</p>
        <p className="text-xs text-slate-400">
          {d.percentage}% &middot; {d.value} exercises
        </p>
      </div>
    );
  }
  return null;
}

export function MuscleGroupChart({ data }: MuscleGroupChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Muscle groups
        </h3>
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-500">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
        Muscle groups
      </h3>

      <div className="flex items-center gap-4">
        <div className="h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] ?? CATEGORY_COLORS.Other}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex flex-1 flex-col gap-2 min-w-0">
          {data.map((entry) => (
            <li key={entry.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[entry.name] ?? CATEGORY_COLORS.Other,
                }}
              />
              <span className="truncate text-xs text-slate-300">
                {entry.name}
              </span>
              <span className="ml-auto text-xs font-medium text-white">
                {entry.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
