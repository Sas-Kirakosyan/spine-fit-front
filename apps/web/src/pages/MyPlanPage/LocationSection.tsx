import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import {
  ChevronDownIcon,
  ThreeDotsIcon,
} from "@/components/Icons/Icons";
import { SettingsRow } from "@/components/SettingsRow/SettingsRow";
import { ToggleSwitch } from "@/components/ToggleSwitch/ToggleSwitch";

interface LocationSectionProps {
  selectedCount: number;
  bodyweightOnly: boolean;
  onBodyweightToggle: (checked: boolean) => void;
  onNavigateToEquipment?: () => void;
}

export function LocationSection({
  selectedCount,
  bodyweightOnly,
  onBodyweightToggle,
  onNavigateToEquipment,
}: LocationSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {t("myPlanPage.sections.location")}
      </h2>
      <div className="flex items-center justify-between">
        <Button className="text-lg font-semibold text-white flex items-center gap-2 hover:text-white/80 transition-colors">
          {t("myPlanPage.location.myGym")}
          <ChevronDownIcon />
        </Button>
        <Button className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
          <ThreeDotsIcon />
        </Button>
      </div>

      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
        <div className="space-y-4">
          <SettingsRow
            label={t("myPlanPage.location.equipment")}
            value={t("myPlanPage.location.selected", { count: selectedCount })}
            onClick={onNavigateToEquipment}
          />

          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-white">
              {t("myPlanPage.location.bodyweightOnly")}
            </span>
            <ToggleSwitch
              checked={bodyweightOnly}
              onChange={onBodyweightToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
