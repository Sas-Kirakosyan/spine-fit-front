import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PainDataPoint, VolumePeriod } from "@/utils/progressStats";

const PERIOD_OPTIONS: { key: VolumePeriod; label: string }[] = [
  { key: "week", label: "W" },
  { key: "month", label: "M" },
  { key: "3months", label: "3M" },
  { key: "year", label: "Y" },
];

interface PainChartProps {
  data: PainDataPoint[];
  title?: string;
  activePeriod?: VolumePeriod;
  onPeriodChange?: (period: VolumePeriod) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-[#1B1E2B] px-3 py-2 shadow-xl ring-1 ring-white/10">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-white">
          {payload[0].value} / 10
        </p>
      </div>
    );
  }
  return null;
}

export function PainChart({
  data,
  title = "Pain Level",
  activePeriod,
  onPeriodChange,
}: PainChartProps) {
  const showPeriodSelector = activePeriod !== undefined && onPeriodChange !== undefined;

  const percentageChange = (() => {
    if (data.length < 2) return null;
    const first = data[0].painLevel;
    const last = data[data.length - 1].painLevel;
    const diff = ((last - first) / first) * 100;
    return Math.round(diff);
  })();

  if (data.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            {title}
          </h3>
          {showPeriodSelector && (
            <div className="flex rounded-lg bg-white/5 p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onPeriodChange(opt.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activePeriod === opt.key
                      ? "bg-main text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-500">
            No data for this period
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            {title}
          </h3>
          {percentageChange !== null && (
            <span
              className={`text-xs font-semibold ${
                percentageChange > 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              {percentageChange > 0 ? "+" : ""}{percentageChange}%
            </span>
          )}
        </div>
        {showPeriodSelector && (
          <div className="flex rounded-lg bg-white/5 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onPeriodChange(opt.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activePeriod === opt.key
                    ? "bg-main text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#48c268" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#48c268" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              domain={[1, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="painLevel"
              stroke="#48c268"
              strokeWidth={2}
              fill="url(#painGradient)"
              dot={{
                fill: "#48c268",
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: "#48c268",
                stroke: "#fff",
                strokeWidth: 2,
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
