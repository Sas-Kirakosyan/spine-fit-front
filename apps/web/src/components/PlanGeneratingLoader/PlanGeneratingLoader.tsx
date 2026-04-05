import { useTranslation } from "react-i18next";

export function PlanGeneratingLoader() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-lg font-medium text-foreground">{t("quiz.nav.generatingTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("quiz.nav.generatingSubtitle")}</p>
    </div>
  );
}
