import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";

interface ExitWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onFinish: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ExitWorkoutModal({
  isOpen,
  onClose,
  onDiscard,
  onFinish,
  containerRef,
}: ExitWorkoutModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const sheetContent = (
    <div className="absolute h-full w-full inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close exit workout modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full">
        <div className="bg-[#0E1224] border-t border-slate-700 rounded-t-[30px]">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-3 px-6 pb-8 pt-6 safe-area-bottom">
            <div className="text-center pb-2">
              <h2 className="text-xl font-semibold text-white">
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
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, containerRef.current ?? document.body);
}
