import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/Layout/PageContainer";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { FormCard } from "@/components/Form/FormCard/FormCard";
import { FormHeader } from "@/components/Form/FormHeader/FormHeader";
import { PasswordInput } from "@/components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "@/components/Form/SubmitButton/SubmitButton";
import { supabase } from "@/lib/supabase";
import { updateUserPassword } from "@/lib/authService";

interface ResetPasswordPageProps {
  onNavigateToLogin: () => void;
}

type RecoveryState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "invalid"; message: string; debugUrl?: string };

function ResetPasswordPage({ onNavigateToLogin }: ResetPasswordPageProps) {
  const { t } = useTranslation();

  const [recovery, setRecovery] = useState<RecoveryState>({
    status: "checking",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const recoveryRanRef = useRef(false);

  useEffect(() => {
    // recoveryRanRef guarantees single execution across StrictMode double-mount —
    // the reset token is one-time-use, so we must not call verifyOtp twice.
    if (recoveryRanRef.current) return;
    recoveryRanRef.current = true;

    const originalSearch = window.location.search;
    const originalHash = window.location.hash;
    const urlSnapshot = `${window.location.pathname}${originalSearch}${originalHash}`;

    const hashRaw = originalHash.startsWith("#") ? originalHash.slice(1) : "";
    const hashParams = new URLSearchParams(hashRaw);
    const query = new URLSearchParams(originalSearch);

    const tokenHash = query.get("token_hash");
    const type = query.get("type");
    const code = query.get("code");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashError =
      hashParams.get("error_description") ??
      query.get("error_description") ??
      hashParams.get("error") ??
      query.get("error");

    const finalize = (state: RecoveryState) => {
      setRecovery(state);
      window.history.replaceState({}, "", "/reset-password");
    };

    (async () => {
      if (hashError) {
        finalize({ status: "invalid", message: hashError });
        return;
      }

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (error) {
          finalize({ status: "invalid", message: error.message });
          return;
        }
        finalize({ status: "ready" });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          finalize({ status: "invalid", message: error.message });
          return;
        }
        finalize({ status: "ready" });
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          finalize({ status: "invalid", message: error.message });
          return;
        }
        finalize({ status: "ready" });
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        finalize({ status: "ready" });
        return;
      }

      finalize({
        status: "invalid",
        message: t("resetPasswordPage.errors.invalidLink"),
        debugUrl: urlSnapshot,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (): boolean => {
    const next: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      next.password = t("resetPasswordPage.errors.passwordRequired");
    } else if (password.length < 6) {
      next.password = t("resetPasswordPage.errors.passwordMinLength");
    }

    if (!confirmPassword) {
      next.confirmPassword = t("resetPasswordPage.errors.passwordRequired");
    } else if (password && confirmPassword !== password) {
      next.confirmPassword = t("resetPasswordPage.errors.passwordsMismatch");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
    if (apiError) setApiError("");
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (recovery.status !== "ready") return;
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const result = await updateUserPassword(password);
      if (!result.ok) {
        setApiError(
          result.error.message ||
            t("resetPasswordPage.errors.updateFailed")
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        localStorage.setItem("loginPrefillEmail", user.email);
      }
      await supabase.auth.signOut();
      onNavigateToLogin();
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : t("resetPasswordPage.errors.updateFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToLogin} />

      <div className="mt-10 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader
            title={t("resetPasswordPage.title")}
            subtitle={t("resetPasswordPage.subtitle")}
          />

          {recovery.status === "checking" && (
            <p className="mt-6 text-center text-sm text-gray-600">
              {t("resetPasswordPage.checking")}
            </p>
          )}

          {recovery.status === "invalid" && (
            <div className="mt-6 space-y-4">
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
              >
                {recovery.message ||
                  t("resetPasswordPage.errors.invalidLink")}
              </p>
              {import.meta.env.DEV && recovery.debugUrl && (
                <p className="break-all rounded-lg bg-gray-100 px-3 py-2 text-[11px] text-gray-600">
                  URL: {recovery.debugUrl}
                </p>
              )}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full rounded-[14px] bg-main py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-main/90"
              >
                {t("resetPasswordPage.backToLogin")}
              </button>
            </div>
          )}

          {recovery.status === "ready" && (
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <PasswordInput
                label={t("resetPasswordPage.newPassword")}
                id="new-password"
                name="newPassword"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                placeholder={t("resetPasswordPage.newPasswordPlaceholder")}
              />

              <PasswordInput
                label={t("resetPasswordPage.confirmPassword")}
                id="confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmChange}
                error={errors.confirmPassword}
                placeholder={t(
                  "resetPasswordPage.confirmPasswordPlaceholder"
                )}
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
                text={t("resetPasswordPage.submit")}
                loading={loading}
              />
            </form>
          )}
        </FormCard>
      </div>
    </PageContainer>
  );
}

export default ResetPasswordPage;
