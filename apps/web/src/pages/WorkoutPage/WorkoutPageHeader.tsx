import { useTranslation } from "react-i18next";

interface WorkoutPageHeaderProps {
  onNavigateToMyPlan: () => void;
}

export function WorkoutPageHeader({ onNavigateToMyPlan }: WorkoutPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <button onClick={onNavigateToMyPlan}>
      <header className="flex mt-2 ml-2.5">
        <div className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white">{t("workoutPage.buttons.myPlan")}</div>
      </header>
    </button>
  );
}
