import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  accentColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  subValue,
  accentColor = "text-main",
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-[#1B1E2B]/80 p-4 ring-1 ring-white/5 transition-all hover:ring-white/10">
      <div className="flex items-center gap-2">
        <div className={`${accentColor}`}>{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {subValue && (
          <span className="text-sm text-slate-400">{subValue}</span>
        )}
      </div>
    </div>
  );
}
