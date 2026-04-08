import { PageContainer } from "@/Layout/PageContainer";
import type { MyPlanPageProps } from "@/types/pages";
import { planFieldsConfig } from "@/types/planSettings";
import { SelectionModal } from "@/components/SelectionModal/SelectionModal";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import { MyPlanPageHeader } from "./MyPlanPageHeader";
import { GoalSection } from "./GoalSection";
import { LocationSection } from "./LocationSection";
import { TrainingProfileSection } from "./TrainingProfileSection";
import { TrainingFormatSection } from "./TrainingFormatSection";
import { PreferencesSection } from "./PreferencesSection";
import { RegenerateButton } from "./RegenerateButton";
import { ResetModal } from "./ResetModal";
import { RegenerateModal } from "./RegenerateModal";
import { useMyPlanPage } from "./useMyPlanPage";

function MyPlanPage({
  onNavigateBack,
  onNavigateToAvailableEquipment,
}: MyPlanPageProps) {
  const plan = useMyPlanPage({ onNavigateBack });

  return (
    <PageContainer contentClassName="gap-8">
      <MyPlanPageHeader onNavigateBack={plan.handleBack} />

      <div className="flex flex-col flex-1 gap-6 pb-24 px-2.5">
        <GoalSection
          goal={plan.planSettings.goal}
          onFieldClick={plan.handleFieldClick}
        />

        <LocationSection
          selectedCount={plan.selectedCount}
          bodyweightOnly={plan.bodyweightOnly}
          onBodyweightToggle={plan.setBodyweightOnly}
          onNavigateToEquipment={onNavigateToAvailableEquipment}
        />

        <TrainingProfileSection
          planSettings={plan.planSettings}
          onFieldClick={plan.handleFieldClick}
        />

        <TrainingFormatSection
          planSettings={plan.planSettings}
          onFieldClick={plan.handleFieldClick}
          warmUpSets={plan.warmUpSets}
          onWarmUpToggle={plan.setWarmUpSets}
          circuitsAndSupersets={plan.circuitsAndSupersets}
          onCircuitsToggle={plan.setCircuitsAndSupersets}
        />

        <PreferencesSection
          planSettings={plan.planSettings}
          onFieldClick={plan.handleFieldClick}
        />
      </div>

      {plan.hasChanges && (
        <RegenerateButton
          onClick={() => plan.setIsRegenerateModalOpen(true)}
        />
      )}

      <ResetModal
        isOpen={plan.isResetModalOpen}
        onCancel={() => plan.setIsResetModalOpen(false)}
        onReset={plan.handleResetAndGoBack}
      />

      <RegenerateModal
        isOpen={plan.isRegenerateModalOpen}
        isRegenerating={plan.isRegenerating}
        onCancel={() => plan.setIsRegenerateModalOpen(false)}
        onConfirm={plan.handleRegeneratePlan}
      />

      {plan.isRegenerating && <PlanGeneratingLoader />}

      {plan.currentField && (
        <SelectionModal
          isOpen={plan.isModalOpen}
          onClose={plan.handleModalClose}
          title={planFieldsConfig[plan.currentField].title}
          options={planFieldsConfig[plan.currentField].options}
          descriptions={planFieldsConfig[plan.currentField].description}
          headerDescription={
            planFieldsConfig[plan.currentField].headerDescription
          }
          selectedValue={plan.planSettings[plan.currentField]}
          onSelect={plan.handleFieldSelect}
        />
      )}
    </PageContainer>
  );
}

export default MyPlanPage;
