interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-[24px]",
  md: "text-[28px]",
  lg: "text-[32px]",
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <span
      className={`font-semibold uppercase tracking-[0.3em] text-white ${sizeClasses[size]} ${className}`}
    >
      SpineFit
    </span>
  );
}
