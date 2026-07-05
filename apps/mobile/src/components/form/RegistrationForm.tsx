import { useState } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";
import { signUpWithEmail, isUserExistsError } from "../../lib/authService";

export interface RegistrationSuccessInfo {
  requiresEmailConfirmation: boolean;
  userId: string | null;
}

// The web registration form only collects email + password; keep parity.
export interface RegistrationFormData {
  email: string;
  password: string;
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

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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

  const handleSubmit = async () => {
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
    <View className="mt-7 gap-5">
      <FormField
        label={t("registrationPage.email")}
        value={formData.email}
        onChangeText={(v) => handleChange("email", v)}
        error={errors.email}
        placeholder={t("registrationPage.emailPlaceholder")}
        keyboardType="email-address"
      />

      <PasswordInput
        label={t("registrationPage.password")}
        value={formData.password}
        onChangeText={(v) => handleChange("password", v)}
        error={errors.password}
        placeholder={t("registrationPage.passwordPlaceholder")}
      />

      {authError ? (
        <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {authError}
        </Text>
      ) : null}

      <SubmitButton text={submitLabel} onPress={handleSubmit} loading={loading} />
    </View>
  );
}
