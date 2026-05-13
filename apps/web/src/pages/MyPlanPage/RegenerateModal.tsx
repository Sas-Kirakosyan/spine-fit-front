import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PulsingDots } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";

interface RegenerateModalProps {
  isOpen: boolean;
  isRegenerating: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RegenerateModal({
  isOpen,
  isRegenerating,
  error,
  onCancel,
  onConfirm,
}: RegenerateModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      dismissable={!isRegenerating}
      ariaLabel={
        isRegenerating
          ? t("myPlanPage.regeneratingTitle")
          : t("myPlanPage.regenerateConfirm")
      }
    >
      {isRegenerating ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-center text-lg font-semibold text-white">
            {t("myPlanPage.regeneratingTitle")}
          </p>
          <PulsingDots />
        </div>
      ) : (
        <>
          <p className="mb-6 text-center text-lg font-semibold text-white">
            {t("myPlanPage.regenerateConfirm")}
          </p>
          {error && (
            <div className="mb-4 rounded-lg bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              className="flex-1 rounded-[10px] bg-gray-600 py-3 text-base font-semibold text-white min-h-[48px]"
            >
              {t("common.no")}
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 rounded-[10px] bg-main py-3 text-base font-semibold text-white min-h-[48px]"
            >
              {t("common.yes")}
            </Button>
          </div>
        </>
      )}
    </ConfirmDialog>
  );
}
