interface CompletedCheckmarkProps {
  className?: string;
  containerClassName?: string;
}

export function CompletedCheckmark({
  className = "h-6 w-6",
  containerClassName = "absolute inset-0 flex items-center justify-center bg-emerald-900/60 text-white",
}: CompletedCheckmarkProps) {
  return (
    <div className={containerClassName}>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M5 10.5 8.2 14 15 6" />
      </svg>
    </div>
  );
}

export default CompletedCheckmark;
