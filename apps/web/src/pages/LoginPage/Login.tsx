import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/Layout/PageContainer";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { FormField } from "@/components/Form/FormField/FormField";
import { PasswordInput } from "@/components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { Divider } from "@/components/Form/Divider/Divider";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { signInWithEmail } from "@/lib/authService";
import {
  generatePlanFromQuiz,
  type StoredQuizData,
} from "@/lib/planGeneration";

import type { LoginFormData, LoginProps } from "@/types/auth";

function mapLoginError(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return t("loginPage.errors.invalidCredentials");
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return t("loginPage.errors.network");
  }
  return message || t("loginPage.errors.unknown");
}

function Login({ onNavigateToHome, onNavigateToWorkout }: LoginProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillEmail = localStorage.getItem("loginPrefillEmail");
    if (!prefillEmail) return;
    setFormData((prev) => ({ ...prev, email: prefillEmail }));
    localStorage.removeItem("loginPrefillEmail");
  }, []);

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
    if (authError) setAuthError("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setAuthError("");
    try {
      const result = await signInWithEmail(formData.email, formData.password);
      if (!result.ok) {
        setAuthError(mapLoginError(result.error.message, t));
        return;
      }

      const pendingQuiz = localStorage.getItem("quizAnswers");
      const hasPlan = localStorage.getItem("generatedPlan");
      let planReady = Boolean(hasPlan);

      if (pendingQuiz && !hasPlan) {
        try {
          const quizData = JSON.parse(pendingQuiz) as StoredQuizData;
          const planResult = await generatePlanFromQuiz(quizData);
          if (!planResult.ok) {
            setAuthError(t("loginPage.errors.planGenerationFailed"));
            return;
          }
          planReady = true;
        } catch {
          setAuthError(t("loginPage.errors.planGenerationFailed"));
          return;
        }
      }

      if (planReady) {
        if (onNavigateToWorkout) onNavigateToWorkout();
      } else if (onNavigateToHome) {
        onNavigateToHome();
      }
    } catch (err) {
      setAuthError(
        mapLoginError(err instanceof Error ? err.message : "", t)
      );
    } finally {
      setLoading(false);
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

            {authError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
              >
                {authError}
              </p>
            )}

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

            <SubmitButton text={t("loginPage.signIn")} loading={loading} />

            <Divider />
          </form>
        </FormCard>
      </div>
    </PageContainer>
  );
}

export default Login;
