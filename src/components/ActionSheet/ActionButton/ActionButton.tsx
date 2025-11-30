interface ActionButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  variant?: "default" | "blue" | "red";
}

const variantClasses = {
  default: "bg-slate-700/40 text-slate-200 hover:bg-slate-700/60",
  blue: "bg-blue-600/10 text-blue-300 hover:bg-blue-600/20",
  red: "bg-rose-600/10 text-rose-300 hover:bg-rose-600/20",
};

const iconVariantClasses = {
  default: "bg-slate-600/40 text-slate-100",
  blue: "bg-blue-500/20 text-blue-300",
  red: "bg-rose-500/20 text-rose-300",
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
          ? "focus-visible:ring-blue-400/80"
          : variant === "blue"
          ? "focus-visible:ring-blue-400/80"
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
