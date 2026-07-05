import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Linking from "expo-linking";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { FormCard } from "../components/form/FormCard";
import { FormHeader } from "../components/form/FormHeader";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { Logo } from "../components/common/Logo";
import { supabase } from "../lib/supabase";
import { updateUserPassword, signOut } from "../lib/authService";
import { storage } from "../storage/storageAdapter";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;

type RecoveryState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "invalid"; message: string };

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const url = Linking.useURL();

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

  // The reset token is one-time-use, so the recovery exchange must run exactly
  // once even if the URL is re-delivered on re-render.
  useEffect(() => {
    if (recoveryRanRef.current) return;

    const finalize = (state: RecoveryState) => setRecovery(state);

    const run = async (link: string | null) => {
      recoveryRanRef.current = true;

      const hashRaw = link?.includes("#") ? link.slice(link.indexOf("#") + 1) : "";
      const hashParams = new URLSearchParams(hashRaw);
      const queryParams = link
        ? (Linking.parse(link).queryParams ?? {})
        : {};
      const getQuery = (key: string): string | null => {
        const value = queryParams[key];
        return typeof value === "string" ? value : null;
      };

      const tokenHash = getQuery("token_hash");
      const type = getQuery("type");
      const code = getQuery("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashError =
        hashParams.get("error_description") ??
        getQuery("error_description") ??
        hashParams.get("error") ??
        getQuery("error");

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
      });
    };

    if (url) {
      void run(url);
      return;
    }

    // useURL() can briefly report null while the initial link is resolved;
    // give it a moment before falling back to the session check.
    const timer = setTimeout(() => {
      if (!recoveryRanRef.current) void run(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [url, t]);

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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
    if (apiError) setApiError("");
  };

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
    if (apiError) setApiError("");
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (recovery.status !== "ready") return;
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const result = await updateUserPassword(password);
      if (!result.ok) {
        setApiError(
          result.error.message || t("resetPasswordPage.errors.updateFailed")
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        await storage.setItem("loginPrefillEmail", user.email);
      }
      await signOut();
      navigation.navigate("Login");
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
    <SafeAreaView className="flex-1 bg-[#132f54]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 pt-4">
          <Logo size="sm" />
        </View>

        <ScrollView
          className="flex-1 mt-8"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <FormCard className="mt-20">
            <FormHeader
              title={t("resetPasswordPage.title")}
              subtitle={t("resetPasswordPage.subtitle")}
            />

            {recovery.status === "checking" && (
              <Text className="mt-6 text-center text-sm text-gray-600">
                {t("resetPasswordPage.checking")}
              </Text>
            )}

            {recovery.status === "invalid" && (
              <View className="mt-6 gap-4">
                <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {recovery.message || t("resetPasswordPage.errors.invalidLink")}
                </Text>
                <SubmitButton
                  text={t("resetPasswordPage.backToLogin")}
                  onPress={() => navigation.navigate("Login")}
                />
              </View>
            )}

            {recovery.status === "ready" && (
              <View className="mt-7 gap-5">
                <PasswordInput
                  label={t("resetPasswordPage.newPassword")}
                  value={password}
                  onChangeText={handlePasswordChange}
                  error={errors.password}
                  placeholder={t("resetPasswordPage.newPasswordPlaceholder")}
                />

                <PasswordInput
                  label={t("resetPasswordPage.confirmPassword")}
                  value={confirmPassword}
                  onChangeText={handleConfirmChange}
                  error={errors.confirmPassword}
                  placeholder={t("resetPasswordPage.confirmPasswordPlaceholder")}
                />

                {apiError ? (
                  <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {apiError}
                  </Text>
                ) : null}

                <SubmitButton
                  text={t("resetPasswordPage.submit")}
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            )}
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
