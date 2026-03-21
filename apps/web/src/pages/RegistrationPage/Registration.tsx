import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RegistrationFormData, RegistrationProps } from "@/types/auth";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PageContainer } from "@/Layout/PageContainer";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { FormField } from "@/components/Form/FormField/FormField";
import { PasswordInput } from "@/components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { Divider } from "@/components/Form/Divider/Divider";
import { AuthSwitchLink } from "@/components/Form/AuthSwitchLink/AuthSwitchLink";

function Registration({
  onSwitchToLogin,
  onNavigateToHome,
  onNavigateToWorkout,
}: RegistrationProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof RegistrationFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("registrationPage.errors.firstNameRequired");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("registrationPage.errors.lastNameRequired");
    }

    if (!formData.username.trim()) {
      newErrors.username = t("registrationPage.errors.usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("registrationPage.errors.usernameMinLength");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("registrationPage.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("registrationPage.errors.emailInvalid");
    }

    if (!formData.password) {
      newErrors.password = t("registrationPage.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("registrationPage.errors.passwordMinLength");
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("registrationPage.errors.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("registrationPage.errors.passwordsMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Registration data:", formData);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    }
  };

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToHome} />

      <div className="mt-8 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader title={t("registrationPage.title")} subtitle={t("registrationPage.subtitle")} />

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("registrationPage.firstName")}
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                placeholder={t("registrationPage.firstNamePlaceholder")}
              />

              <FormField
                label={t("registrationPage.lastName")}
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                placeholder={t("registrationPage.lastNamePlaceholder")}
              />
            </div>

            <FormField
              label={t("registrationPage.username")}
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              placeholder={t("registrationPage.usernamePlaceholder")}
            />

            <FormField
              label={t("registrationPage.email")}
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder={t("registrationPage.emailPlaceholder")}
            />

            <PasswordInput
              label={t("registrationPage.password")}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder={t("registrationPage.passwordPlaceholder")}
            />

            <PasswordInput
              label={t("registrationPage.confirmPassword")}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder={t("registrationPage.confirmPasswordPlaceholder")}
            />

            <SubmitButton text={t("registrationPage.register")} />

            <Divider />
          </form>
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
