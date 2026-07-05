import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import type { LoginFormData } from "@spinefit/shared";
import { FormCard } from "../components/form/FormCard";
import { FormHeader } from "../components/form/FormHeader";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { GoogleSignInButton } from "../components/form/GoogleSignInButton";
import { Divider } from "../components/form/Divider";
import { AuthSwitchLink } from "../components/form/AuthSwitchLink";
import { Logo } from "../components/common/Logo";
import { ForgotPasswordModal } from "../components/modals/ForgotPasswordModal";
import { signInWithEmail } from "../lib/authService";
import { storage } from "../storage/storageAdapter";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

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

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Set by ResetPasswordScreen after a successful password update.
  useEffect(() => {
    (async () => {
      const prefillEmail = await storage.getItem("loginPrefillEmail");
      if (!prefillEmail) return;
      setFormData((prev) => ({ ...prev, email: prefillEmail }));
      await storage.removeItem("loginPrefillEmail");
    })();
  }, []);

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (authError) setAuthError("");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email.trim()) newErrors.email = t("loginPage.errors.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = t("loginPage.errors.emailInvalid");
    if (!formData.password) newErrors.password = t("loginPage.errors.passwordRequired");
    else if (formData.password.length < 6)
      newErrors.password = t("loginPage.errors.passwordMinLength");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigateToMain = () => {
    navigation.getParent()?.navigate("Main");
  };

  const handleSubmit = async () => {
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
      navigateToMain();
    } catch (err) {
      setAuthError(mapLoginError(err instanceof Error ? err.message : "", t));
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
            <FormHeader title={t("loginPage.title")} subtitle={t("loginPage.subtitle")} />

            <View className="mt-8 gap-5">
              <FormField
                label={t("loginPage.email")}
                value={formData.email}
                onChangeText={(v) => handleChange("email", v)}
                error={errors.email}
                placeholder={t("loginPage.emailPlaceholder")}
                keyboardType="email-address"
              />

              <PasswordInput
                label={t("loginPage.password")}
                value={formData.password}
                onChangeText={(v) => handleChange("password", v)}
                error={errors.password}
                placeholder={t("loginPage.passwordPlaceholder")}
              />

              {authError ? (
                <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {authError}
                </Text>
              ) : null}

              <Pressable onPress={() => setForgotOpen(true)} className="self-end">
                <Text className="text-sm font-medium text-main">
                  {t("loginPage.forgotPassword")}
                </Text>
              </Pressable>

              <SubmitButton
                text={t("loginPage.signIn")}
                onPress={handleSubmit}
                loading={loading}
              />

              <GoogleSignInButton
                label={t("loginPage.continueWithGoogle")}
                intent="login"
                onError={setAuthError}
                onSuccess={navigateToMain}
              />

              <Divider />
            </View>
          </FormCard>
        </ScrollView>

        <AuthSwitchLink
          question={t("loginPage.noAccount")}
          linkText={t("registrationPage.register")}
          onPress={() => navigation.navigate("Register")}
        />
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        open={forgotOpen}
        initialEmail={formData.email}
        onClose={() => setForgotOpen(false)}
      />
    </SafeAreaView>
  );
}
