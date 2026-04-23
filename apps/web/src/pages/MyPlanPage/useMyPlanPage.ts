import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { EquipmentCategory } from "@/types/equipment";
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
  const [bodyweightOnly, setBodyweightOnly] = useState(false);
  const [warmUpSets, setWarmUpSets] = useState(true);
  const [circuitsAndSupersets, setCircuitsAndSupersets] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [planSettings, setPlanSettings] =
    useState<PlanSettings>(getPlanSettings());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<PlanFieldId | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const initialSettingsRef = useRef<PlanSettings>(getPlanSettings());

  const hasChanges = useMemo(() => {
    const fields: PlanFieldId[] = [
      "goal", "workoutsPerWeek", "duration", "experience",
      "trainingSplit", "exerciseVariability", "units", "cardio", "stretching",
    ];
    return fields.some((f) => planSettings[f] !== initialSettingsRef.current[f]);
  }, [planSettings]);

  useEffect(() => {
    const calculateSelectedCount = () => {
      try {
        const saved = localStorage.getItem("equipmentData");
        if (saved) {
          const equipmentData: EquipmentCategory[] = JSON.parse(saved);
          const count = equipmentData.reduce(
            (total, category) =>
              total + category.items.filter((item) => item.selected).length,
            0,
          );
          setSelectedCount(count);
        } else {
          setSelectedCount(0);
        }
      } catch (error) {
        console.error("Error calculating selected count:", error);
        setSelectedCount(0);
      }
    };

    calculateSelectedCount();

    const handleFocus = () => {
      calculateSelectedCount();
    };

    const handleEquipmentUpdate = () => {
      calculateSelectedCount();
    };

    addEventListener("focus", handleFocus);
    addEventListener("equipmentDataUpdated", handleEquipmentUpdate);

    return () => {
      removeEventListener("focus", handleFocus);
      removeEventListener("equipmentDataUpdated", handleEquipmentUpdate);
    };
  }, []);

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
    setRegenerateError(null);
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
        planSettings: PlanSettings;
      };

      if (result.success && result.plan) {
        savePlanAndSettings(result.plan, result.planSettings);
        if (result.planSettings) {
          setPlanSettings(result.planSettings);
          initialSettingsRef.current = result.planSettings;
        }
        setIsRegenerating(false);
        setIsRegenerateModalOpen(false);
        onNavigateBack();
        return;
      }
    } catch (error) {
      console.error("Failed to regenerate plan:", error);
      setRegenerateError(
        t("myPlanPage.regenerateError", "Failed to regenerate your plan. Please try again."),
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return {
    // State
    planSettings,
    bodyweightOnly,
    warmUpSets,
    circuitsAndSupersets,
    selectedCount,
    hasChanges,
    isModalOpen,
    currentField,
    isResetModalOpen,
    isRegenerateModalOpen,
    isRegenerating,
    regenerateError,
    setRegenerateError,

    // Toggles
    setBodyweightOnly,
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
  };
}
