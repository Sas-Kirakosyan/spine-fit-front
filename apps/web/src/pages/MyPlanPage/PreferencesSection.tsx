import { useTranslation } from "react-i18next";
import { SettingsRow } from "@/components/SettingsRow/SettingsRow";
import { ChevronRightIcon } from "@/components/Icons/Icons";
import { Button } from "@/components/Buttons/Button";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";

interface PreferencesSectionProps {
  planSettings: PlanSettings;
  onFieldClick: (fieldId: PlanFieldId) => void;
}

export function PreferencesSection({
  planSettings,
  onFieldClick,
}: PreferencesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {t("myPlanPage.sections.preferences")}
      </h2>
      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
        <div className="space-y-4">
          <SettingsRow
            label={t("myPlanPage.preferences.units")}
            value={planSettings.units}
            onClick={() => onFieldClick("units")}
          />
          <SettingsRow
            label={t("myPlanPage.preferences.cardio")}
            value={planSettings.cardio}
            onClick={() => onFieldClick("cardio")}
          />
          <SettingsRow
            label={t("myPlanPage.preferences.stretching")}
            value={planSettings.stretching}
            onClick={() => onFieldClick("stretching")}
          />

          <Button className="w-full flex items-center justify-between text-left">
            <span className="text-base font-medium text-white">
              {t("myPlanPage.preferences.manageExercises")}
            </span>
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
