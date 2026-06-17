import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ConfirmDialog } from "@/components/ui/Modal";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}

export function DeleteAccountModal({
  isOpen,
  onCancel,
  onConfirm,
  isDeleting,
  error,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      dismissable={!isDeleting}
      ariaLabel={t("settingsPage.modals.deleteAccountConfirmTitle")}
    >
      <p className="mb-3 text-center text-lg font-semibold text-white">
        {t("settingsPage.modals.deleteAccountConfirmTitle")}
      </p>
      <p className="mb-6 text-center text-sm text-slate-400">
        {t("settingsPage.modals.deleteAccountConfirmDescription")}
      </p>
      {error && (
        <p className="mb-4 text-center text-sm font-medium text-red-500">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1 rounded-[10px] bg-gray-600 py-3 text-base font-semibold text-white min-h-[48px] disabled:opacity-60"
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 rounded-[10px] bg-red-600 py-3 text-base font-semibold text-white min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDeleting ? t("common.aria.loading") : t("common.delete")}
        </Button>
      </div>
    </ConfirmDialog>
  );
}
