interface TreeDotButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
  svgClassName?: string;
}

export function TreeDotButton({
  onClick,
  ariaLabel = "Actions",
  className = "rounded-full p-1 text-slate-200",
  svgClassName = "h-5 w-5",
}: TreeDotButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={handleClick}
    >
      <svg
        aria-hidden="true"
        className={svgClassName}
        viewBox="0 0 16 4"
        fill="currentColor"
      >
        <circle cx="2" cy="2" r="2" />
        <circle cx="8" cy="2" r="2" />
        <circle cx="14" cy="2" r="2" />
      </svg>
    </button>
  );
}

export default TreeDotButton;
