interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export function Button({
  children,
  onClick,
  className = "",
  type = "button",
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
