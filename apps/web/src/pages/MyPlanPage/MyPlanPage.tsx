import { useTranslation } from "react-i18next";
import { PageContainer } from "@/Layout/PageContainer";
import type { MyPlanPageProps } from "@/types/pages";
import { SelectionModal } from "@/components/SelectionModal/SelectionModal";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import { MyPlanPageHeader } from "./MyPlanPageHeader";
import { GoalSection } from "./GoalSection";
import { TrainingProfileSection } from "./TrainingProfileSection";
import { TrainingFormatSection } from "./TrainingFormatSection";
import { PreferencesSection } from "./PreferencesSection";
import { RegenerateButton } from "./RegenerateButton";
import { ResetModal } from "./ResetModal";
import { RegenerateModal } from "./RegenerateModal";
import { useMyPlanPage } from "./useMyPlanPage";
import { getTranslatedField } from "./planFieldsI18n";

function MyPlanPage({ onNavigateBack, onNavigateToProfile }: MyPlanPageProps) {
  const { t } = useTranslation();
  const plan = useMyPlanPage({ onNavigateBack });
  const translatedField = plan.currentField
    ? getTranslatedField(t, plan.currentField)
    : null;

  return (
    <PageContainer contentClassName="gap-8">
      <MyPlanPageHeader onNavigateBack={plan.handleBack} />

      <div className="flex flex-col flex-1 gap-6 pb-24 px-2.5">
        <GoalSection
          goal={plan.planSettings.goal}
          onFieldClick={plan.handleFieldClick}
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
          onNavigateToProfile={onNavigateToProfile}
        />
      </div>

      {plan.hasChanges && (
        <RegenerateButton onClick={() => plan.setIsRegenerateModalOpen(true)} />
      )}

      <ResetModal
        isOpen={plan.isResetModalOpen}
        onCancel={() => plan.setIsResetModalOpen(false)}
        onReset={plan.handleResetAndGoBack}
      />

      <RegenerateModal
        isOpen={plan.isRegenerateModalOpen && !plan.isRegenerating}
        error={plan.regenerateError}
        onCancel={() => {
          plan.setIsRegenerateModalOpen(false);
          plan.setRegenerateError(null);
        }}
        onConfirm={plan.handleRegeneratePlan}
      />

      {plan.isRegenerating && (
        <PlanGeneratingLoader
          apiPhase={plan.regenerateApiPhase}
          onAllStepsComplete={plan.handleRegenerateComplete}
          stepLabelPrefix="quiz.nav.regenerating"
        />
      )}

      {plan.currentField && translatedField && (
        <SelectionModal
          isOpen={plan.isModalOpen}
          onClose={plan.handleModalClose}
          title={translatedField.title}
          options={translatedField.options}
          optionLabels={translatedField.optionLabels}
          descriptions={translatedField.descriptions}
          headerDescription={translatedField.headerDescription}
          selectedValue={plan.planSettings[plan.currentField]}
          onSelect={plan.handleFieldSelect}
        />
      )}
    </PageContainer>
  );
}

export default MyPlanPage;
