import { useTranslation } from "react-i18next";
import type { RegistrationProps } from "@/types/auth";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PageContainer } from "@/Layout/PageContainer";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { Divider } from "@/components/Form/Divider/Divider";
import { AuthSwitchLink } from "@/components/Form/AuthSwitchLink/AuthSwitchLink";
import { RegistrationForm } from "@/components/Form/RegistrationForm/RegistrationForm";

function Registration({
  onSwitchToLogin,
  onNavigateToHome,
  onNavigateToWorkout,
}: RegistrationProps) {
  const { t } = useTranslation();

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToHome} />

      <div className="mt-8 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader
            title={t("registrationPage.title")}
            subtitle={t("registrationPage.subtitle")}
          />

          <RegistrationForm
            submitLabel={t("registrationPage.register")}
            onSuccess={() => {
              if (onNavigateToWorkout) onNavigateToWorkout();
            }}
          />

          <Divider />
        </FormCard>
      </div>

      <AuthSwitchLink
        question={t("registrationPage.haveAccount")}
        linkText={t("registrationPage.login")}
        onClick={onSwitchToLogin || (() => {})}
      />
    </PageContainer>
  );
}

export default Registration;
