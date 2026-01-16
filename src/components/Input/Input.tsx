interface InputProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  unit?: string;
  type?: string;
  min?: number;
  disabled?: boolean;
  wrapperClassName?: string; // for outer <label>
  inputClassName?: string; // for actual <input> or display box
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  onFocus,
  placeholder,
  unit,
  type = "text",
  min,
  disabled = false,
  wrapperClassName = "",
  inputClassName = "",
}) => {
  return (
    <label
      className={`flex flex-col gap-2 text-left w-full ${wrapperClassName}`}
    >
      {label && (
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${
            disabled ? "text-slate-600" : "text-slate-300"
          }`}
        >
          {label}
          {unit && (
            <span
              className={`ml-1 text-[10px] uppercase ${
                disabled ? "text-slate-500" : "text-slate-400"
              }`}
            >
              ({unit})
            </span>
          )}
        </span>
      )}

      {disabled ? (
        <div
          className={`flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-lg font-semibold text-white/35 ${inputClassName}`}
        >
          {value || placeholder || "—"}
        </div>
      ) : (
        <input
          type={type}
          min={min}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          disabled={disabled}
          className={`h-12 rounded-[18px] border border-white/80 bg-transparent px-5 text-lg font-semibold text-white outline-none transition focus:border-main focus:ring-2 focus:ring-main/40 ${inputClassName}`}
        />
      )}
    </label>
  );
};
