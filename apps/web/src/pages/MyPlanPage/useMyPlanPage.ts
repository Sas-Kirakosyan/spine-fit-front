import { useState, useRef, useMemo, useEffect } from "react";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";
import {
  getPlanSettings,
  savePlanSettings,
  savePlanAndSettings,
} from "@/lib/planService";
import {
  runPlanGenerationLoop,
  isRetryableStatus,
  type AttemptOutcome,
} from "@/lib/planRetry";
import type { GeneratedPlan } from "@spinefit/shared";

interface UseMyPlanPageOptions {
  onNavigateBack: () => void;
  onRegenerateFailed?: () => void;
}

export function useMyPlanPage({
  onNavigateBack,
  onRegenerateFailed,
}: UseMyPlanPageOptions) {
  const [warmUpSets, setWarmUpSets] = useState(true);
  const [circuitsAndSupersets, setCircuitsAndSupersets] = useState(true);
  const [planSettings, setPlanSettings] =
    useState<PlanSettings>(getPlanSettings());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<PlanFieldId | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateApiPhase, setRegenerateApiPhase] = useState<
    "pending" | "success"
  >("pending");
  const initialSettingsRef = useRef<PlanSettings>(getPlanSettings());
  const pendingPlanRef = useRef<GeneratedPlan | null>(null);
  // Guards the retry loop against the page unmounting mid-retry. Sets
  // true in the body so StrictMode's dev double-invoke doesn't leave it false.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    const fields: PlanFieldId[] = [
      "goal", "workoutsPerWeek", "duration", "experience",
      "trainingSplit", "units", "cardio", "stretching",
    ];
    return fields.some((f) => planSettings[f] !== initialSettingsRef.current[f]);
  }, [planSettings]);

  const handleFieldClick = (fieldId: PlanFieldId) => {
    setCurrentField(fieldId);
    setIsModalOpen(true);
  };

  const handleFieldSelect = (value: string) => {
    if (currentField) {
      const newSettings = {
        ...planSettings,
        [currentField]: value,
      };
      setPlanSettings(newSettings);
      savePlanSettings(newSettings);
    }
    setIsModalOpen(false);
    setCurrentField(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentField(null);
  };

  const handleBack = () => {
    if (hasChanges) {
      setIsResetModalOpen(true);
    } else {
      onNavigateBack();
    }
  };

  const handleResetAndGoBack = () => {
    setPlanSettings(initialSettingsRef.current);
    savePlanSettings(initialSettingsRef.current);
    setIsResetModalOpen(false);
    onNavigateBack();
  };

  const handleRegeneratePlan = async () => {
    setIsRegenerating(true);
    setRegenerateApiPhase("pending");
    pendingPlanRef.current = null;

    const attempt = async (): Promise<AttemptOutcome> => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz/regenerate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(planSettings),
          },
        );
        if (!response.ok) {
          console.error("Regenerate plan API error:", response.status);
          // 503 (AI overloaded) → retry (capped by the loop); 502/other → terminal.
          return isRetryableStatus(response.status) ? "retry" : "giveUp";
        }
        const result = (await response.json()) as {
          success: boolean;
          plan: GeneratedPlan;
        };
        if (!result.success || !result.plan) {
          console.error("Regenerate returned invalid result:", result);
          return "giveUp";
        }
        if (!mountedRef.current) return "retry";
        // Hand the plan to the checklist loader; it paces the animation and
        // calls handleRegenerateComplete once all steps finish.
        pendingPlanRef.current = result.plan;
        setRegenerateApiPhase("success");
        return "success";
      } catch (error) {
        // Network error / backend unreachable → transient, retry (capped by the loop).
        console.error("Failed to regenerate plan:", error);
        return "retry";
      }
    };

    runPlanGenerationLoop({
      attempt,
      isMounted: () => mountedRef.current,
      onGiveUp: () => {
        // Existing plan is untouched (saved only in handleRegenerateComplete,
        // the success path). Reset before any apiPhase="success" so the loader
        // never mounts → handleRegenerateComplete never runs → no double nav.
        setIsRegenerating(false);
        setRegenerateApiPhase("pending");
        setIsRegenerateModalOpen(false);
        onRegenerateFailed?.();
      },
    });
  };

  const handleRegenerateComplete = () => {
    const plan = pendingPlanRef.current;
    if (plan) {
      savePlanAndSettings(plan);
      if (plan.settings) {
        setPlanSettings(plan.settings);
        initialSettingsRef.current = plan.settings;
      }
    }
    pendingPlanRef.current = null;
    setIsRegenerating(false);
    setRegenerateApiPhase("pending");
    setIsRegenerateModalOpen(false);
    onNavigateBack();
  };

  return {
    // State
    planSettings,
    warmUpSets,
    circuitsAndSupersets,
    hasChanges,
    isModalOpen,
    currentField,
    isResetModalOpen,
    isRegenerateModalOpen,
    isRegenerating,
    regenerateApiPhase,

    // Toggles
    setWarmUpSets,
    setCircuitsAndSupersets,

    // Modals
    setIsResetModalOpen,
    setIsRegenerateModalOpen,

    // Handlers
    handleFieldClick,
    handleFieldSelect,
    handleModalClose,
    handleBack,
    handleResetAndGoBack,
    handleRegeneratePlan,
    handleRegenerateComplete,
  };
}
