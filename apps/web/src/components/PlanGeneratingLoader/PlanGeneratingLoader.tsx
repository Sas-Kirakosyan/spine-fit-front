import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const STEP_DURATION_MS = 2400;
const FINAL_CHECKMARK_DWELL_MS = 500;
const STEP_IDS = [1, 2, 3, 4, 5] as const;
type StepId = (typeof STEP_IDS)[number];
type StepStatus = "pending" | "active" | "done";

export type PlanGeneratingLoaderProps = {
  apiPhase: "pending" | "success";
  onAllStepsComplete: () => void;
  stepLabelPrefix?: string;
};

export function PlanGeneratingLoader({
  apiPhase,
  onAllStepsComplete,
  stepLabelPrefix = "quiz.nav.generating",
}: PlanGeneratingLoaderProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [allDone, setAllDone] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentStep < 5) {
      const timer = window.setTimeout(() => {
        setCurrentStep((s) => (s + 1) as StepId);
      }, STEP_DURATION_MS);
      return () => window.clearTimeout(timer);
    }
    if (!allDone && apiPhase === "success") {
      setAllDone(true);
      return;
    }
    if (allDone) {
      const timer = window.setTimeout(() => {
        if (mountedRef.current) onAllStepsComplete();
      }, FINAL_CHECKMARK_DWELL_MS);
      return () => window.clearTimeout(timer);
    }
    return;
  }, [currentStep, apiPhase, allDone, onAllStepsComplete]);

  const statusOf = (id: StepId): StepStatus => {
    if (allDone) return "done";
    if (id < currentStep) return "done";
    if (id > currentStep) return "pending";
    return "active";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
      <ul className="flex flex-col gap-5 w-full max-w-[320px]">
        {STEP_IDS.map((id) => (
          <StepRow
            key={id}
            label={t(`${stepLabelPrefix}.step${id}`)}
            status={statusOf(id)}
          />
        ))}
      </ul>
    </div>
  );
}

function StepRow({
  label,
  status,
}: {
  label: string;
  status: StepStatus;
}) {
  const textClass =
    status === "pending"
      ? "text-white/40"
      : status === "active"
        ? "text-white"
        : "text-white/80";

  return (
    <li className="flex items-center gap-2">
      <span className={`text-base font-medium transition-colors ${textClass}`}>
        {label}
      </span>
      {status === "active" && (
        <span className="inline-flex items-end justify-center w-5 h-5 pb-[5px]">
          <PulsingDots />
        </span>
      )}
      {status === "done" && (
        <span className="inline-flex items-center justify-center w-5 h-5">
          <CheckMark />
        </span>
      )}
    </li>
  );
}

export function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="plan-step-dot w-[5px] h-[5px] rounded-full bg-white"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function CheckMark() {
  return (
    <svg
      className="w-5 h-5 text-main"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path className="plan-step-check-path" d="M5 12 L10 17 L19 7" />
    </svg>
  );
}
