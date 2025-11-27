interface BottomNavProps {
  activePage: "workout" | "profile" | "history";
  onWorkoutClick: () => void;
  onProfileClick: () => void;
  onHistoryClick: () => void;
}

const baseNavButtonClass =
  "flex flex-1 flex-col items-center py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors";

const getNavButtonClassName = (isActive: boolean) =>
  `${baseNavButtonClass} ${
    isActive
      ? "bg-blue-600 text-white"
      : "bg-[#1B1E2B] text-slate-200 hover:text-white"
  }`;

export function BottomNav({
  activePage,
  onWorkoutClick,
  onProfileClick,
  onHistoryClick,
}: BottomNavProps) {
  return (
    <nav className="bg-[#1B1E2B] flex justify-evenly gap-4 rounded-[10px]">
      <button
        type="button"
        className={getNavButtonClassName(activePage === "workout")}
        onClick={onWorkoutClick}
      >
        Workout
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "profile")}
        onClick={onProfileClick}
      >
        Profile
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "history")}
        onClick={onHistoryClick}
      >
        History
      </button>
    </nav>
  );
}

