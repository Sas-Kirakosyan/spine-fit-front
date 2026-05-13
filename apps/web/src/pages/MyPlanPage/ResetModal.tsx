import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ConfirmDialog } from "@/components/ui/Modal";

interface ResetModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onReset: () => void;
}

export function ResetModal({ isOpen, onCancel, onReset }: ResetModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      ariaLabel={t("myPlanPage.resetConfirm")}
    >
      <p className="mb-6 text-center text-lg font-semibold text-white">
        {t("myPlanPage.resetConfirm")}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          className="flex-1 rounded-[10px] bg-gray-600 py-3 text-base font-semibold text-white min-h-[48px]"
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={onReset}
          className="flex-1 rounded-[10px] bg-main py-3 text-base font-semibold text-white min-h-[48px]"
        >
          {t("common.reset")}
        </Button>
      </div>
    </ConfirmDialog>
  );
}
