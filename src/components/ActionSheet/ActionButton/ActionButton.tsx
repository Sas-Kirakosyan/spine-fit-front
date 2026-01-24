interface ActionButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  variant?: "default" | "blue" | "red" | "green";
}

const variantClasses = {
  default: "bg-slate-700/40 text-slate-200 hover:bg-slate-700/60",
  blue: "bg-main/10 text-main/70 hover:bg-main/20",
  red: "bg-rose-600/10 text-rose-300 hover:bg-rose-600/20",
  green: "bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/20",
};

const iconVariantClasses = {
  default: "bg-slate-600/40 text-slate-100",
  blue: "bg-main/20 text-main/70",
  red: "bg-rose-500/20 text-rose-300",
  green: "bg-emerald-500/20 text-emerald-300",
};

export function ActionButton({
  icon,
  text,
  onClick,
  variant = "default",
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl p-4 text-left transition focus:outline-none focus-visible:ring-2 ${
        variant === "default"
          ? "focus-visible:ring-main/80"
          : variant === "blue"
          ? "focus-visible:ring-main/80"
          : "focus-visible:ring-rose-400/80"
      } ${variantClasses[variant]}`}
    >
      <span className="flex items-center gap-3 text-sm font-semibold">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconVariantClasses[variant]}`}
        >
          {icon}
        </span>
        {text}
      </span>
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4l4 4-4 4" />
      </svg>
    </button>
  );
}
