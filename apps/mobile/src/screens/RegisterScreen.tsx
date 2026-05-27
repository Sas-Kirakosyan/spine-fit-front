import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import type { RegistrationFormData } from "@spinefit/shared";
import { FormCard } from "../components/form/FormCard";
import { FormHeader } from "../components/form/FormHeader";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { Divider } from "../components/form/Divider";
import { AuthSwitchLink } from "../components/form/AuthSwitchLink";
import { Logo } from "../components/common/Logo";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};
    if (!formData.firstName.trim()) newErrors.firstName = t("registrationPage.errors.firstNameRequired");
    if (!formData.lastName.trim()) newErrors.lastName = t("registrationPage.errors.lastNameRequired");
    if (!formData.username.trim()) newErrors.username = t("registrationPage.errors.usernameRequired");
    else if (formData.username.length < 3) newErrors.username = t("registrationPage.errors.usernameMinLength");
    if (!formData.email.trim()) newErrors.email = t("registrationPage.errors.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t("registrationPage.errors.emailInvalid");
    if (!formData.password) newErrors.password = t("registrationPage.errors.passwordRequired");
    else if (formData.password.length < 6) newErrors.password = t("registrationPage.errors.passwordMinLength");
    if (!formData.confirmPassword) newErrors.confirmPassword = t("registrationPage.errors.confirmPasswordRequired");
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t("registrationPage.errors.passwordsMismatch");
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

        <ScrollView className="flex-1 mt-6" contentContainerStyle={{ paddingBottom: 20 }}>
          <FormCard>
            <FormHeader title={t("registrationPage.title")} subtitle={t("registrationPage.subtitle")} />

            <View className="mt-7 gap-5">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <FormField
                    label={t("registrationPage.firstName")}
                    value={formData.firstName}
                    onChangeText={(v) => handleChange("firstName", v)}
                    error={errors.firstName}
                    placeholder={t("registrationPage.firstNamePlaceholder")}
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label={t("registrationPage.lastName")}
                    value={formData.lastName}
                    onChangeText={(v) => handleChange("lastName", v)}
                    error={errors.lastName}
                    placeholder={t("registrationPage.lastNamePlaceholder")}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <FormField
                label={t("registrationPage.username")}
                value={formData.username}
                onChangeText={(v) => handleChange("username", v)}
                error={errors.username}
                placeholder={t("registrationPage.usernamePlaceholder")}
              />

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

              <PasswordInput
                label={t("registrationPage.confirmPassword")}
                value={formData.confirmPassword}
                onChangeText={(v) => handleChange("confirmPassword", v)}
                error={errors.confirmPassword}
                placeholder={t("registrationPage.confirmPasswordPlaceholder")}
              />

              <SubmitButton text={t("registrationPage.register")} onPress={handleSubmit} />
              <Divider />
            </View>
          </FormCard>
        </ScrollView>

        <AuthSwitchLink
          question={t("registrationPage.haveAccount")}
          linkText={t("registrationPage.login")}
          onPress={() => navigation.navigate("Login")}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
