interface ActiveWorkoutHeaderProps {
  onNavigateBack: () => void;
  buttonClass?: string;
  title?: string;
}

export function ActiveWorkoutHeader({
  onNavigateBack,
  buttonClass = "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-blue-600 transition-colors",
  title = "Active workout",
}: ActiveWorkoutHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <button
        type="button"
        onClick={onNavigateBack}
        className={buttonClass}
        aria-label="back to workout list"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
          {title}
        </p>
      </div>

      <div className="w-10" />
    </header>
  );
}

export default ActiveWorkoutHeader;
