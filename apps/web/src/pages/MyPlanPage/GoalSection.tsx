import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ChevronRightIcon } from "@/components/Icons/Icons";
import type { PlanFieldId } from "@/types/planSettings";
import { getFieldOptionLabel } from "./planFieldsI18n";

interface GoalSectionProps {
  goal: string;
  onFieldClick: (fieldId: PlanFieldId) => void;
}

export function GoalSection({ goal, onFieldClick }: GoalSectionProps) {
  const { t } = useTranslation();

  return (
    <Button
      onClick={() => onFieldClick("goal")}
      className="w-full rounded-[14px] bg-main p-4 flex items-center justify-between gap-3 text-white"
    >
      <span className="shrink-0 text-lg font-semibold">{t("myPlanPage.goal")}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate text-base font-semibold">
          {getFieldOptionLabel(t, "goal", goal)}
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0" />
      </div>
    </Button>
  );
}
