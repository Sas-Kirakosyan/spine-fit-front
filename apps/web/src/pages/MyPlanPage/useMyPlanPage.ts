import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";
import {
  getPlanSettings,
  savePlanSettings,
  savePlanAndSettings,
} from "@/lib/planService";
import type { GeneratedPlan } from "@spinefit/shared";

interface UseMyPlanPageOptions {
  onNavigateBack: () => void;
}

export function useMyPlanPage({ onNavigateBack }: UseMyPlanPageOptions) {
  const { t } = useTranslation();
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
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const initialSettingsRef = useRef<PlanSettings>(getPlanSettings());
  const pendingPlanRef = useRef<GeneratedPlan | null>(null);

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
    setRegenerateError(null);
    pendingPlanRef.current = null;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planSettings),
        },
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = (await response.json()) as {
        success: boolean;
        plan: GeneratedPlan;
      };

      if (!result.success || !result.plan) {
        throw new Error("Invalid regenerate response");
      }

      // Hand the plan to the checklist loader; it paces the animation and
      // calls handleRegenerateComplete once all steps finish.
      pendingPlanRef.current = result.plan;
      setRegenerateApiPhase("success");
    } catch (error) {
      console.error("Failed to regenerate plan:", error);
      setRegenerateError(t("myPlanPage.regenerateError"));
      setIsRegenerating(false);
      setRegenerateApiPhase("pending");
    }
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
    regenerateError,
    setRegenerateError,

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
