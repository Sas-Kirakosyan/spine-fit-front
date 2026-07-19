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
import { Logo } from "../components/common/Logo";
import { CheckIcon } from "../components/icons/Icons";
import { ForgotPasswordModal } from "../components/modals/ForgotPasswordModal";
import { signInWithEmail, getCurrentUser } from "../lib/authService";
import { fetchPlan, hasPlan } from "../lib/planService";
import { hydrateQuizFromSupabase } from "../lib/quizStorage";
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
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleGoogleSuccess = async () => {
    await fetchPlan();
    if (!(await hasPlan())) {
      const user = await getCurrentUser();
      if (user) await hydrateQuizFromSupabase(user.id);
    }
    navigateToMain();
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

      // Plain login always lands on the workout page. When there's no plan
      // yet it shows its "no plan — generate" empty state; we only recover
      // the quiz answers from Supabase first (a logout clears them locally;
      // a brand-new device never had them) so the "Generate" button has data
      // to work with.
      await fetchPlan();
      if (!(await hasPlan())) {
        await hydrateQuizFromSupabase(result.user.id);
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
        <View className="py-4 pl-1">
          <Logo size="lg" onPress={() => navigation.navigate("Home")} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <FormCard>
            <FormHeader title={t("loginPage.title")} subtitle={t("loginPage.subtitle")} />

            <View className="mt-7 gap-5">
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
                <Text
                  accessibilityRole="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
                >
                  {authError}
                </Text>
              ) : null}

              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => setRememberMe((prev) => !prev)}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`h-4 w-4 items-center justify-center rounded-sm border ${
                      rememberMe ? "border-main bg-main" : "border-gray-400 bg-white"
                    }`}
                  >
                    {rememberMe ? <CheckIcon size={12} color="white" /> : null}
                  </View>
                  <Text className="text-sm text-gray-900">{t("loginPage.rememberMe")}</Text>
                </Pressable>

                <Pressable onPress={() => setForgotOpen(true)}>
                  <Text className="text-sm font-medium text-main">
                    {t("loginPage.forgotPassword")}
                  </Text>
                </Pressable>
              </View>

              <SubmitButton
                text={t("loginPage.signIn")}
                onPress={handleSubmit}
                loading={loading}
              />

              <GoogleSignInButton
                label={t("loginPage.continueWithGoogle")}
                intent="login"
                onError={setAuthError}
                onSuccess={handleGoogleSuccess}
              />

              <View className="flex-row items-center justify-center gap-1">
                <Text className="text-sm text-gray-500">{t("loginPage.noAccount")}</Text>
                <Pressable onPress={() => navigation.navigate("Home")}>
                  <Text className="text-sm font-medium text-main">
                    {t("loginPage.startProgram")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        open={forgotOpen}
        initialEmail={formData.email}
        onClose={() => setForgotOpen(false)}
      />
    </SafeAreaView>
  );
}
