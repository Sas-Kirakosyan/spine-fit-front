interface FilterChipsProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  labelFormatter?: (value: string) => string;
}

function toLabel(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function FilterChips({
  options,
  selected,
  onSelect,
  labelFormatter = toLabel,
}: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            onClick={() => onSelect(active ? null : option)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-[#e77d10] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {labelFormatter(option)}
          </button>
        );
      })}
    </div>
  );
}
