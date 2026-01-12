import { useState, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { MyPlanPageProps } from "@/types/pages";
import type { EquipmentCategory } from "@/types/equipment";
import { Button } from "@/components/Buttons/Button";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ThreeDotsIcon,
} from "@/components/Icons/Icons";
import { MyPlanPageHeader } from "./MyPlanPageHeader";
import { SelectionModal } from "@/components/SelectionModal/SelectionModal";
import type { PlanFieldId, PlanSettings } from "@/types/planSettings";
import {
  planFieldsConfig,
  loadPlanSettings,
  savePlanSettings,
} from "@/types/planSettings";
import {
  generateTrainingPlan,
  savePlanToLocalStorage,
  type GeneratedPlan,
} from "@/utils/planGenerator";
import allExercisesData from "@/MockData/allExercise.json";
import type { Exercise } from "@/types/exercise";
import type { FinishedWorkoutSummary } from "@/types/workout";
import type { QuizAnswers } from "@/types/quiz";

export function MyPlanPage({
  onNavigateBack,
  onNavigateToAvailableEquipment,
}: MyPlanPageProps) {
  const [bodyweightOnly, setBodyweightOnly] = useState(false);
  const [warmUpSets, setWarmUpSets] = useState(true);
  const [circuitsAndSupersets, setCircuitsAndSupersets] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [planSettings, setPlanSettings] = useState<PlanSettings>(
    loadPlanSettings()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<PlanFieldId | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const calculateSelectedCount = () => {
      try {
        const saved = localStorage.getItem("equipmentData");
        if (saved) {
          const equipmentData: EquipmentCategory[] = JSON.parse(saved);
          const count = equipmentData.reduce(
            (total, category) =>
              total + category.items.filter((item) => item.selected).length,
            0
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

  const handleGeneratePlan = () => {
    setIsGenerating(true);

    try {
      // Load quiz answers from localStorage
      const quizDataString = localStorage.getItem("quizAnswers");
      const quizData: QuizAnswers | null = quizDataString
        ? JSON.parse(quizDataString)
        : null;

      // Validate that quiz/onboarding was completed
      if (!quizData) {
        alert(
          "⚠️ Please complete the onboarding quiz first to generate a personalized plan."
        );
        setIsGenerating(false);
        return;
      }

      // Load equipment data
      const equipmentDataString = localStorage.getItem("equipmentData");
      const equipmentData: EquipmentCategory[] = equipmentDataString
        ? JSON.parse(equipmentDataString)
        : [];

      // Extract available equipment names from configured equipment
      const availableEquipment = equipmentData.flatMap((category) =>
        category.items.filter((item) => item.selected).map((item) => item.name)
      );

      // If no equipment configured yet, assume all equipment exists (extract from exercise database)
      // Once user configures equipment preferences, only selected equipment will be used
      const finalEquipment =
        availableEquipment.length > 0
          ? availableEquipment
          : equipmentData.length === 0
          ? // No equipment data configured - assume all equipment exists
            Array.from(
              new Set(
                (allExercisesData as Exercise[]).map((ex) => ex.equipment)
              )
            ).filter((eq) => eq && eq !== "none")
          : ["bodyweight"];

      // Load workout history
      const historyString = localStorage.getItem("workoutHistory");
      const workoutHistory: FinishedWorkoutSummary[] = historyString
        ? JSON.parse(historyString)
        : [];

      // Generate the plan
      const plan = generateTrainingPlan(
        allExercisesData as Exercise[],
        planSettings,
        quizData,
        bodyweightOnly ? ["bodyweight"] : finalEquipment,
        workoutHistory
      );

      console.log("Generated plan:", plan);

      // Save to localStorage
      savePlanToLocalStorage(plan);

      // Update state
      setGeneratedPlan(plan);

      alert(
        `✅ Plan Generated!\n\n${plan.name}\n\n${
          plan.workoutDays.length
        } workouts per week with ${
          plan.workoutDays[0]?.exercises.length || 0
        } exercises per day.`
      );
    } catch (error) {
      console.error("Error generating plan:", error);
      alert(
        "Failed to generate plan. Please check your settings and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer contentClassName="gap-8 px-2.5">
      <MyPlanPageHeader onNavigateBack={onNavigateBack} />

      <div className="flex flex-col flex-1 gap-6 pb-24">
        {/* Goal Section */}
        <Button
          onClick={() => handleFieldClick("goal")}
          className="w-full rounded-[14px] bg-main p-4 flex items-center justify-between text-white"
        >
          <span className="text-lg font-semibold">Goal</span>
          <div className="flex items-center gap-2">
            <span className="text-l ml-10 font-semibold">
              {planSettings.goal}
            </span>
            <ChevronRightIcon className="h-5 w-5" />
          </div>
        </Button>

        {/* Location Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            LOCATION
          </h2>
          <div className="flex items-center justify-between">
            <Button className="text-lg font-semibold text-white flex items-center gap-2 hover:text-white/80 transition-colors">
              My Gym
              <ChevronDownIcon />
            </Button>
            <Button className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
              <ThreeDotsIcon />
            </Button>
          </div>

          {/* Equipment Card */}
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button
                onClick={onNavigateToAvailableEquipment}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Equipment
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {selectedCount} Selected
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Bodyweight-Only
                </span>
                <Button
                  onClick={() => setBodyweightOnly(!bodyweightOnly)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    bodyweightOnly ? "bg-main" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      bodyweightOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Training Profile Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            TRAINING PROFILE
          </h2>
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button
                onClick={() => handleFieldClick("workoutsPerWeek")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Workouts / Week
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.workoutsPerWeek}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button
                onClick={() => handleFieldClick("duration")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Duration
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.duration}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button
                onClick={() => handleFieldClick("experience")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Experience
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.experience}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Training Format Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            TRAINING FORMAT
          </h2>
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button
                onClick={() => handleFieldClick("trainingSplit")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Training Split
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.trainingSplit}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button
                onClick={() => handleFieldClick("exerciseVariability")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Exercise Variability
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.exerciseVariability}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Warm-Up Sets
                </span>
                <Button
                  onClick={() => setWarmUpSets(!warmUpSets)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    warmUpSets ? "bg-main" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      warmUpSets ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Circuits & Supersets
                </span>
                <Button
                  onClick={() => setCircuitsAndSupersets(!circuitsAndSupersets)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    circuitsAndSupersets ? "bg-main" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      circuitsAndSupersets ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            PREFERENCES
          </h2>
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button
                onClick={() => handleFieldClick("units")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">Units</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.units}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button
                onClick={() => handleFieldClick("cardio")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">Cardio</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.cardio}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button
                onClick={() => handleFieldClick("stretching")}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Stretching
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {planSettings.stretching}
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Manage Exercises
                </span>
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Generate Plan Button */}
        <Button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] rounded-[14px] bg-main p-4 text-white font-semibold text-lg"
        >
          {isGenerating ? "Generating..." : "Generate Plan"}
        </Button>

        {/* Generated Plan Preview */}
        {generatedPlan && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              GENERATED PLAN
            </h2>
            <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {generatedPlan.name}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Created:{" "}
                    {new Date(generatedPlan.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {generatedPlan.workoutDays.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="border-t border-white/10 pt-3"
                  >
                    <p className="text-base font-medium text-white mb-1">
                      {day.dayName}
                    </p>
                    <p className="text-sm text-white/60">
                      {day.exercises.length} exercises •{" "}
                      {day.exercises[0]?.sets || 0} sets each
                    </p>
                  </div>
                ))}

                {generatedPlan.missingMuscleGroups.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm font-medium text-yellow-500 mb-1">
                      ⚠️ Missing Muscle Groups
                    </p>
                    <p className="text-xs text-white/60">
                      {generatedPlan.missingMuscleGroups.join(", ")}
                    </p>
                    {generatedPlan.alternativeExercises.length > 0 && (
                      <p className="text-xs text-white/60 mt-2">
                        {generatedPlan.alternativeExercises.length} alternative
                        exercises suggested
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selection Modal */}
      {currentField && (
        <SelectionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title={planFieldsConfig[currentField].title}
          options={planFieldsConfig[currentField].options}
          descriptions={planFieldsConfig[currentField].description}
          headerDescription={planFieldsConfig[currentField].headerDescription}
          selectedValue={planSettings[currentField]}
          onSelect={handleFieldSelect}
        />
      )}
    </PageContainer>
  );
}
