import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

interface RegenerateButtonProps {
  onClick: () => void;
}

export function RegenerateButton({ onClick }: RegenerateButtonProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30">
      <Button
        onClick={onClick}
        className="w-full max-w-md rounded-[14px] bg-main py-4 px-6 text-lg font-semibold text-white shadow-lg"
      >
        {t("myPlanPage.regeneratePlan", "Regenerate Plan")}
      </Button>
    </div>
  );
}
