import { useTranslation } from "react-i18next";
import { SettingsRow } from "@/components/SettingsRow/SettingsRow";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";
import { getStoredPainStatus } from "@/utils/painStatus";
import { getFieldOptionLabel } from "./planFieldsI18n";

interface PreferencesSectionProps {
  planSettings: PlanSettings;
  onFieldClick: (fieldId: PlanFieldId) => void;
  onNavigateToProfile?: () => void;
}

export function PreferencesSection({
  planSettings,
  onFieldClick,
  onNavigateToProfile,
}: PreferencesSectionProps) {
  const { t } = useTranslation();
  const painStatus = getStoredPainStatus();
  const painStatusLabel = t(`myPlanPage.preferences.painStatus.${painStatus}`);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {t("myPlanPage.sections.preferences")}
      </h2>
      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
        <div className="space-y-4">
          <SettingsRow
            label={t("myPlanPage.preferences.units")}
            value={getFieldOptionLabel(t, "units", planSettings.units)}
            onClick={() => onFieldClick("units")}
          />
          <SettingsRow
            label={t("myPlanPage.preferences.cardio")}
            value={getFieldOptionLabel(t, "cardio", planSettings.cardio)}
            onClick={() => onFieldClick("cardio")}
          />
          <SettingsRow
            label={t("myPlanPage.preferences.stretching")}
            value={getFieldOptionLabel(
              t,
              "stretching",
              planSettings.stretching,
            )}
            onClick={() => onFieldClick("stretching")}
          />
          <SettingsRow
            label={t("myPlanPage.preferences.backProfile")}
            value={painStatusLabel}
            onClick={onNavigateToProfile}
          />
        </div>
      </div>
    </div>
  );
}
