interface WorkoutPageHeaderProps {
  onNavigateToMyPlan: () => void;
}

export function WorkoutPageHeader({
  onNavigateToMyPlan,
}: WorkoutPageHeaderProps) {
  return (
    <button onClick={onNavigateToMyPlan}>
      <header className="flex mt-2 ml-2.5">
        <div className="w-8 h-8 border-3 border-main rounded-full mr-1"></div>
        <div className="text-2xl font-semibold text-white">My Plan</div>
        <svg
          className="text-main"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </header>
    </button>
  );
}
