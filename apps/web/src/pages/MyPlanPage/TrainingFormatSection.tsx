import { useTranslation } from "react-i18next";
import { SettingsRow } from "@/components/SettingsRow/SettingsRow";
import { ToggleSwitch } from "@/components/ToggleSwitch/ToggleSwitch";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";

interface TrainingFormatSectionProps {
  planSettings: PlanSettings;
  onFieldClick: (fieldId: PlanFieldId) => void;
  warmUpSets: boolean;
  onWarmUpToggle: (checked: boolean) => void;
  circuitsAndSupersets: boolean;
  onCircuitsToggle: (checked: boolean) => void;
}

export function TrainingFormatSection({
  planSettings,
  onFieldClick,
  warmUpSets,
  onWarmUpToggle,
  circuitsAndSupersets,
  onCircuitsToggle,
}: TrainingFormatSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {t("myPlanPage.sections.trainingFormat")}
      </h2>
      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
        <div className="space-y-4">
          <SettingsRow
            label={t("myPlanPage.trainingFormat.trainingSplit")}
            value={planSettings.trainingSplit}
            onClick={() => onFieldClick("trainingSplit")}
          />
          <SettingsRow
            label={t("myPlanPage.trainingFormat.exerciseVariability")}
            value={planSettings.exerciseVariability}
            onClick={() => onFieldClick("exerciseVariability")}
          />

          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-white">
              {t("myPlanPage.trainingFormat.warmUpSets")}
            </span>
            <ToggleSwitch checked={warmUpSets} onChange={onWarmUpToggle} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-white">
              {t("myPlanPage.trainingFormat.circuitsAndSupersets")}
            </span>
            <ToggleSwitch
              checked={circuitsAndSupersets}
              onChange={onCircuitsToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
