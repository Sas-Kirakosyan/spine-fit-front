import { useTranslation } from "react-i18next";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className = "" }: PageLoaderProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`page-loader-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="page-loader-spinner"
        aria-label={t("common.aria.loading")}
        role="status"
      />
    </div>
  );
}
