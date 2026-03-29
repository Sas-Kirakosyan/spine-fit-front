import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/Layout/PageContainer";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { FormField } from "@/components/Form/FormField/FormField";
import { PasswordInput } from "@/components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { Divider } from "@/components/Form/Divider/Divider";
import { AuthSwitchLink } from "@/components/Form/AuthSwitchLink/AuthSwitchLink";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import type { LoginFormData, LoginProps } from "@/types/auth";

function Login({
  onSwitchToRegister,
  onNavigateToHome,
  onNavigateToWorkout,
}: LoginProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = t("loginPage.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("loginPage.errors.emailInvalid");
    }

    if (!formData.password) {
      newErrors.password = t("loginPage.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("loginPage.errors.passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Login data:", formData);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    }
  };

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToHome} />

      <div className="mt-10 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader title={t("loginPage.title")} subtitle={t("loginPage.subtitle")} />

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <FormField
              label={t("loginPage.email")}
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder={t("loginPage.emailPlaceholder")}
            />

            <PasswordInput
              label={t("loginPage.password")}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder={t("loginPage.passwordPlaceholder")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4"
                />
                {t("loginPage.rememberMe")}
              </label>

              <a
                href="#"
                className="text-sm font-medium text-main transition hover:text-main/80"
              >
                {t("loginPage.forgotPassword")}
              </a>
            </div>

            <SubmitButton text={t("loginPage.signIn")} />

            <Divider />
          </form>
        </FormCard>
      </div>

      <AuthSwitchLink
        question={t("loginPage.noAccount")}
        linkText={t("loginPage.register")}
        onClick={onSwitchToRegister || (() => {})}
      />
    </PageContainer>
  );
}

export default Login;
