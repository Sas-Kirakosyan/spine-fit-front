import { useTranslation } from "react-i18next";
import { SettingsRow } from "@/components/SettingsRow/SettingsRow";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";

interface TrainingProfileSectionProps {
  planSettings: PlanSettings;
  onFieldClick: (fieldId: PlanFieldId) => void;
}

export function TrainingProfileSection({
  planSettings,
  onFieldClick,
}: TrainingProfileSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {t("myPlanPage.sections.trainingProfile")}
      </h2>
      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
        <div className="space-y-4">
          <SettingsRow
            label={t("myPlanPage.trainingProfile.workoutsPerWeek")}
            value={planSettings.workoutsPerWeek}
            onClick={() => onFieldClick("workoutsPerWeek")}
          />
          <SettingsRow
            label={t("myPlanPage.trainingProfile.duration")}
            value={planSettings.duration}
            onClick={() => onFieldClick("duration")}
          />
          <SettingsRow
            label={t("myPlanPage.trainingProfile.experience")}
            value={planSettings.experience}
            onClick={() => onFieldClick("experience")}
          />
        </div>
      </div>
    </div>
  );
}
