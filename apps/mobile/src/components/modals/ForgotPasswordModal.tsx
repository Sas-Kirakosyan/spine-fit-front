import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as Linking from "expo-linking";
import { FormField } from "../form/FormField";
import { SubmitButton } from "../form/SubmitButton";
import { CloseIcon } from "../icons/Icons";
import { sendPasswordResetEmail } from "../../lib/authService";

interface ForgotPasswordModalProps {
  open: boolean;
  initialEmail?: string;
  onClose: () => void;
}

export function ForgotPasswordModal({
  open,
  initialEmail = "",
  onClose,
}: ForgotPasswordModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setFieldError("");
      setApiError("");
      setLoading(false);
      setSent(false);
      return;
    }
    setEmail(initialEmail);
  }, [open, initialEmail]);

  const handleChange = (value: string) => {
    setEmail(value);
    if (fieldError) setFieldError("");
    if (apiError) setApiError("");
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setFieldError(t("forgotPasswordModal.errors.emailRequired"));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError(t("forgotPasswordModal.errors.emailInvalid"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      // The deep link back into the app; must be whitelisted in Supabase
      // Auth → URL Configuration → Redirect URLs.
      const result = await sendPasswordResetEmail(
        email.trim(),
        Linking.createURL("reset-password")
      );
      if (!result.ok) {
        setApiError(
          result.error.message || t("loginPage.errors.resetSendFailed")
        );
        return;
      }
      setSent(true);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : t("loginPage.errors.resetSendFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full rounded-2xl bg-white p-5">
          <Pressable
            onPress={onClose}
            className="absolute right-3 top-3 z-10 h-10 w-10 items-center justify-center rounded-full"
            accessibilityLabel={t("forgotPasswordModal.close")}
          >
            <CloseIcon size={16} color="#6b7280" />
          </Pressable>

          <View className="items-center">
            <Text className="text-2xl font-bold text-main">
              {t("forgotPasswordModal.title")}
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-900">
              {sent
                ? t("forgotPasswordModal.successMessage")
                : t("forgotPasswordModal.subtitle")}
            </Text>
          </View>

          {sent ? (
            <View className="mt-6">
              <SubmitButton
                text={t("forgotPasswordModal.close")}
                onPress={onClose}
              />
            </View>
          ) : (
            <View className="mt-5 gap-4">
              <FormField
                label={t("forgotPasswordModal.email")}
                value={email}
                onChangeText={handleChange}
                error={fieldError}
                placeholder={t("forgotPasswordModal.emailPlaceholder")}
                keyboardType="email-address"
              />

              {apiError ? (
                <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {apiError}
                </Text>
              ) : null}

              <SubmitButton
                text={t("forgotPasswordModal.send")}
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
