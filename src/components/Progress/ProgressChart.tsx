import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ProgressDataPoint } from "@/utils/progressStats";
import { formatVolume } from "@/utils/progressStats";

interface ProgressChartProps {
  data: ProgressDataPoint[];
  title?: string;
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
          {formatVolume(payload[0].value)} kg
        </p>
      </div>
    );
  }
  return null;
}

export function ProgressChart({
  data,
  title = "Progress Volume",
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-500">
            No data to display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e77d10" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e77d10" stopOpacity={0} />
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
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => formatVolume(value)}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#e77d10"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              dot={{
                fill: "#e77d10",
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: "#e77d10",
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
