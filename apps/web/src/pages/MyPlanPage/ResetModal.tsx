import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

interface ResetModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onReset: () => void;
}

export function ResetModal({ isOpen, onCancel, onReset }: ResetModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-[14px] bg-[#1B1E2B] p-6 shadow-xl ring-1 ring-white/5">
        <p className="mb-6 text-center text-lg font-semibold text-white">
          {t(
            "myPlanPage.resetConfirm",
            "Are you sure you want to reset all changes?",
          )}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 rounded-[10px] bg-gray-600 py-3 text-base font-semibold text-white"
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={onReset}
            className="flex-1 rounded-[10px] bg-main py-3 text-base font-semibold text-white"
          >
            {t("common.reset", "Reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}
