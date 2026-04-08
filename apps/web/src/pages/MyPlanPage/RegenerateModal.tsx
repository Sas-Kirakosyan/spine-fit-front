import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

interface RegenerateModalProps {
  isOpen: boolean;
  isRegenerating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RegenerateModal({
  isOpen,
  isRegenerating,
  onCancel,
  onConfirm,
}: RegenerateModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-[14px] bg-[#1B1E2B] p-6 shadow-xl ring-1 ring-white/5">
        <p className="mb-6 text-center text-lg font-semibold text-white">
          {t(
            "myPlanPage.regenerateConfirm",
            "Do you really want to regenerate your plan?",
          )}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            disabled={isRegenerating}
            className="flex-1 rounded-[10px] bg-gray-600 py-3 text-base font-semibold text-white"
          >
            {t("common.no", "No")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isRegenerating}
            className="flex-1 rounded-[10px] bg-main py-3 text-base font-semibold text-white"
          >
            {isRegenerating
              ? t("myPlanPage.regenerating", "Generating...")
              : t("common.yes", "Yes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
