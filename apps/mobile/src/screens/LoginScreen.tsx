import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import type { LoginFormData } from "@spinefit/shared";

import { FormCard } from "../components/form/FormCard";
import { FormHeader } from "../components/form/FormHeader";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { Divider } from "../components/form/Divider";
import { GoogleAuthButton } from "../components/form/GoogleAuthButton";
import { AuthSwitchLink } from "../components/form/AuthSwitchLink";
import { Logo } from "../components/common/Logo";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

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
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must contain at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      navigation.getParent()?.navigate("Main");
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign-in with expo-auth-session
    navigation.getParent()?.navigate("Main");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 pt-4">
          <Logo size="sm" />
        </View>

        <ScrollView className="flex-1 mt-8" contentContainerStyle={{ paddingBottom: 20 }}>
          <FormCard>
            <FormHeader title="Login" subtitle="Sign in to your account" />

            <View className="mt-7 gap-5">
              <FormField
                label="Email"
                value={formData.email}
                onChangeText={(v) => handleChange("email", v)}
                error={errors.email}
                placeholder="Enter email"
                keyboardType="email-address"
              />

              <PasswordInput
                label="Password"
                value={formData.password}
                onChangeText={(v) => handleChange("password", v)}
                error={errors.password}
                placeholder="Enter password"
              />

              <SubmitButton text="Sign In" onPress={handleSubmit} />
              <Divider />
              <GoogleAuthButton onPress={handleGoogleSignIn} text="Login with Google" />
            </View>
          </FormCard>
        </ScrollView>

        <AuthSwitchLink
          question="Don't have an account?"
          linkText="Register"
          onPress={() => navigation.navigate("Register")}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
