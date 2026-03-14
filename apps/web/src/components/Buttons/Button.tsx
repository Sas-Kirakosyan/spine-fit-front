interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  className = "",
  type = "button",
  ariaLabel,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
