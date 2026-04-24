import { Logo } from "@/components/Logo/Logo";
interface PageHeaderProps {
  onNavigateToHome?: () => void;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  onNavigateToHome,
  title,
  subtitle,
  showBackButton = false,
  onBack,
}: PageHeaderProps) {
  return (
    <div className="flex items-start py-4 justify-between">
      <div>
        <Logo onClick={onNavigateToHome} />
        {title && (
          <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        )}
        {subtitle && <p className="mt-1 text-sm text-slate-200">{subtitle}</p>}
        {showBackButton && (
          <button type="button" onClick={onBack}>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
              Back
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
