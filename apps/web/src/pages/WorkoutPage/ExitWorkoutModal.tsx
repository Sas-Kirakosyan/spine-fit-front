import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { Sheet } from "@/components/ui/Modal";

interface ExitWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onFinish: () => void;
}

export function ExitWorkoutModal({
  isOpen,
  onClose,
  onDiscard,
  onFinish,
}: ExitWorkoutModalProps) {
  const { t } = useTranslation();

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      ariaLabel={t("exitWorkoutModal.title")}
      className="bg-[#0E1224]"
      bodyClassName="space-y-3 px-6 pb-8 pt-6 safe-area-bottom"
    >
      <div className="text-center pb-2">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          {t("exitWorkoutModal.title")}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t("exitWorkoutModal.subtitle")}
        </p>
      </div>

      <Button
        onClick={onFinish}
        className="w-full h-[48px] rounded-[10px] bg-main text-white font-semibold uppercase tracking-[0.1em]"
      >
        {t("exitWorkoutModal.finish")}
      </Button>

      <Button
        onClick={onDiscard}
        className="w-full h-[48px] rounded-[10px] bg-[#1A1F35] text-red-400 font-semibold uppercase tracking-[0.1em] hover:bg-[#242940] transition-colors"
      >
        {t("exitWorkoutModal.discard")}
      </Button>

      <Button
        onClick={onClose}
        className="w-full h-[48px] rounded-[10px] bg-transparent text-slate-400 font-semibold uppercase tracking-[0.1em] hover:text-white transition-colors"
      >
        {t("exitWorkoutModal.cancel")}
      </Button>
    </Sheet>
  );
}
