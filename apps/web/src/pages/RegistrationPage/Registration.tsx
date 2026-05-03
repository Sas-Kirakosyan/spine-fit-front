import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RegistrationProps } from "@/types/auth";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PageContainer } from "@/Layout/PageContainer";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { Divider } from "@/components/Form/Divider/Divider";
import { AuthSwitchLink } from "@/components/Form/AuthSwitchLink/AuthSwitchLink";
import { RegistrationForm } from "@/components/Form/RegistrationForm/RegistrationForm";
import { GoogleSignInButton } from "@/components/Form/GoogleSignInButton/GoogleSignInButton";

function Registration({
  onSwitchToLogin,
  onNavigateToHome,
  onNavigateToWorkout,
}: RegistrationProps) {
  const { t } = useTranslation();
  const [oauthError, setOauthError] = useState("");

  return (
    <PageContainer widthMode="phone" contentClassName="justify-between">
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

          <div className="mt-5 space-y-3">
            {oauthError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
              >
                {oauthError}
              </p>
            )}
            <GoogleSignInButton
              label={t("registrationPage.continueWithGoogle")}
              onError={setOauthError}
            />
          </div>

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
