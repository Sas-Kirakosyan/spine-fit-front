import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useExerciseName } from "@spinefit/shared";
import type { ExerciseActionSheetProps } from "@/types/workout";
import { ActionButton } from "@/components/ActionSheet/ActionButton/ActionButton";
import { Sheet, ConfirmDialog } from "@/components/ui/Modal";
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

  const closeFeedback = () => {
    setShowFeedback(false);
    setFeedbackText("");
    setFeedbackSent(false);
  };

  return (
    <>
      <Sheet
        isOpen
        onClose={onClose}
        size="md"
        ariaLabel={name}
        bodyClassName="space-y-4 px-5 pb-8 pt-4 sm:px-6"
      >
        <h2 className="mt-2 text-2xl md:text-3xl text-center font-semibold text-white">
          {name}
        </h2>
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
      </Sheet>

      <ConfirmDialog
        isOpen={showFeedback}
        onClose={closeFeedback}
        ariaLabel={t("exerciseActionSheet.feedbackAboutExercise")}
      >
        {feedbackSent ? (
          <p className="text-center text-green-400 text-lg font-medium">
            {t("exerciseActionSheet.feedbackSent")}
          </p>
        ) : (
          <>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-1">
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
                  closeFeedback();
                  onClose();
                }, 1500);
              }}
              className="mt-4 w-full rounded-xl bg-main py-3 text-white font-semibold disabled:opacity-40 min-h-[48px]"
            >
              {t("exerciseActionSheet.send")}
            </button>
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
