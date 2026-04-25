import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/components/Form/FormField/FormField";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { sendPasswordResetEmail } from "@/lib/authService";

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

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const result = await sendPasswordResetEmail(
        email.trim(),
        `${window.location.origin}/reset-password`
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[14px] bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={t("forgotPasswordModal.close")}
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 3 L13 13 M13 3 L3 13" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-main">
            {t("forgotPasswordModal.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-900">
            {sent
              ? t("forgotPasswordModal.successMessage")
              : t("forgotPasswordModal.subtitle")}
          </p>
        </div>

        {sent ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-[14px] bg-main py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-main/90"
          >
            {t("forgotPasswordModal.close")}
          </button>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <FormField
              label={t("forgotPasswordModal.email")}
              id="forgot-password-email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              error={fieldError}
              placeholder={t("forgotPasswordModal.emailPlaceholder")}
            />

            {apiError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
              >
                {apiError}
              </p>
            )}

            <SubmitButton
              text={t("forgotPasswordModal.send")}
              loading={loading}
            />
          </form>
        )}
      </div>
    </div>
  );
}
