import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useExerciseName } from "@spinefit/shared";
import type { ExerciseActionSheetProps } from "@/types/workout";
import { ActionButton } from "@/components/ActionSheet/ActionButton/ActionButton";
import {
  InfoIcon,
  PlayIcon,
  TrashIcon,
  ReplaceIcon,
  FeedbackIcon,
} from "@/components/Icons/Icons";

export function ExerciseActionSheet({
  exercise,
  onClose,
  onShowDetails,
  onStartWorkout,
  onReplace,
  onDelete,
  //containerRef: _containerRef,
}: ExerciseActionSheetProps) {
  const { t } = useTranslation();
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const sheetContent = (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label="close action sheet"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full max-w-[440px] mx-auto">
        <div className="bg-[#161827] min-h-[300px] max-h-[85vh] border-t rounded-t-[30px] flex flex-col">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-6 px-5 pb-8 pt-4 sm:px-6 flex-1 overflow-y-auto">
            <div>
              <h2 className="mt-2 text-2xl text-center font-semibold text-white">
                {name}
              </h2>
            </div>
            <ActionButton
              icon={<InfoIcon />}
              text={t("exerciseActionSheet.viewDetails")}
              onClick={() => {
                onShowDetails();
                onClose();
              }}
              variant="default"
            />
            {onStartWorkout && (
              <ActionButton
                icon={<PlayIcon />}
                text={t("exerciseActionSheet.viewSets")}
                onClick={() => {
                  onStartWorkout();
                  onClose();
                }}
                variant="blue"
              />
            )}
            <ActionButton
              icon={<ReplaceIcon />}
              text={t("exerciseActionSheet.replaceExercise")}
              onClick={() => {
                onReplace?.();
                onClose();
              }}
              variant="green"
            />
            <ActionButton
              icon={<TrashIcon />}
              text={t("exerciseActionSheet.deleteFromWorkout")}
              onClick={() => {
                onDelete?.();
                onClose();
              }}
              variant="red"
            />
            <ActionButton
              icon={<FeedbackIcon />}
              text={t("exerciseActionSheet.feedbackAboutExercise")}
              onClick={() => setShowFeedback(true)}
              variant="violet"
            />
          </div>
        </div>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            role="button"
            tabIndex={-1}
            aria-label="close feedback modal"
            onClick={() => {
              setShowFeedback(false);
              setFeedbackText("");
              setFeedbackSent(false);
            }}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <div className="relative z-[70] w-full max-w-[400px] mx-4 bg-[#161827] rounded-2xl p-6">
            {feedbackSent ? (
              <p className="text-center text-green-400 text-lg font-medium">
                {t("exerciseActionSheet.feedbackSent")}
              </p>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {t("exerciseActionSheet.feedbackAboutExercise")}
                </h3>
                <p className="text-md text-slate-400 mb-4">{name}</p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t("exerciseActionSheet.feedbackPlaceholder")}
                  className="w-full h-32 rounded-xl bg-[#1e2035] text-white placeholder-slate-500 p-3 resize-none outline-none focus:ring-2 focus:ring-main"
                />
                <button
                  disabled={!feedbackText.trim()}
                  onClick={() => {
                    setFeedbackSent(true);
                    setTimeout(() => {
                      setShowFeedback(false);
                      setFeedbackText("");
                      setFeedbackSent(false);
                      onClose();
                    }, 1500);
                  }}
                  className="mt-4 w-full rounded-xl bg-main py-3 text-white font-semibold disabled:opacity-40"
                >
                  {t("exerciseActionSheet.send")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(sheetContent, document.body);
}
