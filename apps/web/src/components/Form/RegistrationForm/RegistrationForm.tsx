import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RegistrationFormData } from "@/types/auth";
import { FormField } from "@/components/Form/FormField/FormField";
import { PasswordInput } from "@/components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { signUpWithEmail, isUserExistsError } from "@/lib/authService";

export interface RegistrationSuccessInfo {
  requiresEmailConfirmation: boolean;
  userId: string | null;
}

interface RegistrationFormProps {
  submitLabel: string;
  onSuccess: (
    formData: RegistrationFormData,
    info: RegistrationSuccessInfo
  ) => Promise<void> | void;
}

function mapRegisterError(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();
  if (isUserExistsError(message)) {
    return t("registrationPage.errors.userExists");
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return t("registrationPage.errors.network");
  }
  return message || t("registrationPage.errors.unknown");
}

export function RegistrationForm({
  submitLabel,
  onSuccess,
}: RegistrationFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegistrationFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (authError) setAuthError("");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setAuthError("");
    try {
      const result = await signUpWithEmail(formData.email, formData.password);

      if (!result.ok) {
        setAuthError(mapRegisterError(result.error.message, t));
        return;
      }

      try {
        await onSuccess(formData, {
          requiresEmailConfirmation: result.requiresEmailConfirmation,
          userId: result.user?.id ?? null,
        });
      } catch (successErr) {
        setAuthError(
          successErr instanceof Error
            ? successErr.message
            : t("registrationPage.errors.unknown")
        );
      }
    } catch (err) {
      setAuthError(
        mapRegisterError(err instanceof Error ? err.message : "", t)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
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

      {authError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {authError}
        </p>
      )}

      <SubmitButton text={submitLabel} loading={loading} />
    </form>
  );
}
