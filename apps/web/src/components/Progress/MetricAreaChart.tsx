import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { VolumePeriod } from "@/utils/progressStats";

export interface MetricAreaChartProps {
  data: ReadonlyArray<{ label: string }>;
  dataKey: string;
  title: string;
  color: string;
  unit: string;
  formatValue?: (value: number) => string;
  activePeriod?: VolumePeriod;
  onPeriodChange?: (period: VolumePeriod) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
  formatValue: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  formatValue,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-[#1B1E2B] px-3 py-2 shadow-xl ring-1 ring-white/10">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-white">
          {formatValue(payload[0].value)} {unit}
        </p>
      </div>
    );
  }
  return null;
}

const defaultFormat = (value: number) => value.toLocaleString();

export function MetricAreaChart({
  data,
  dataKey,
  title,
  color,
  unit,
  formatValue = defaultFormat,
  activePeriod,
  onPeriodChange,
}: MetricAreaChartProps) {
  const { t } = useTranslation();
  const showPeriodSelector =
    activePeriod !== undefined && onPeriodChange !== undefined;

  const periodOptions = useMemo<{ key: VolumePeriod; label: string }[]>(
    () => [
      { key: "week", label: t("progressPage.progressChart.periods.week") },
      { key: "month", label: t("progressPage.progressChart.periods.month") },
      {
        key: "3months",
        label: t("progressPage.progressChart.periods.3months"),
      },
      { key: "year", label: t("progressPage.progressChart.periods.year") },
    ],
    [t]
  );

  const gradientId = `${dataKey}Gradient`;

  const header = (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      {showPeriodSelector && (
        <div className="flex rounded-lg bg-white/5 p-0.5">
          {periodOptions.map((opt) => (
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
  );

  if (data.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
        {header}
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-500">
            {t("progressPage.progressChart.noData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5">
      {header}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
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
              tickFormatter={formatValue}
              width={45}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} formatValue={formatValue} />}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{
                fill: color,
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: color,
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
