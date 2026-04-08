import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ChevronRightIcon } from "@/components/Icons/Icons";
import type { PlanFieldId } from "@/types/planSettings";

interface GoalSectionProps {
  goal: string;
  onFieldClick: (fieldId: PlanFieldId) => void;
}

export function GoalSection({ goal, onFieldClick }: GoalSectionProps) {
  const { t } = useTranslation();

  return (
    <Button
      onClick={() => onFieldClick("goal")}
      className="w-full rounded-[14px] bg-main p-4 flex items-center justify-between text-white"
    >
      <span className="text-lg font-semibold">{t("myPlanPage.goal")}</span>
      <div className="flex items-center gap-2">
        <span className="text-l ml-10 font-semibold">{goal}</span>
        <ChevronRightIcon className="h-5 w-5" />
      </div>
    </Button>
  );
}
