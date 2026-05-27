import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
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
import { Divider } from "../components/form/Divider";
import { AuthSwitchLink } from "../components/form/AuthSwitchLink";
import { Logo } from "../components/common/Logo";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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

  const handleSubmit = () => {
    if (validateForm()) {
      navigation.getParent()?.navigate("Main");
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

              <SubmitButton text={t("loginPage.signIn")} onPress={handleSubmit} />
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
    </SafeAreaView>
  );
}
