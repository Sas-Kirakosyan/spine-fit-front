import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ConfirmDialog } from "@/components/ui/Modal";

interface RegenerateModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RegenerateModal({
  isOpen,
  onCancel,
  onConfirm,
}: RegenerateModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      dismissable
      ariaLabel={t("myPlanPage.regenerateConfirm")}
    >
      <p className="mb-6 text-center text-lg font-semibold text-white">
        {t("myPlanPage.regenerateConfirm")}
      </p>
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
    </ConfirmDialog>
  );
}
