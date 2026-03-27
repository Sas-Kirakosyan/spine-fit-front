import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
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
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must contain at least 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must contain at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Password confirmation is required";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
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
            <FormHeader title="Registration" subtitle="Create your account" />

            <View className="mt-7 gap-5">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <FormField
                    label="First Name"
                    value={formData.firstName}
                    onChangeText={(v) => handleChange("firstName", v)}
                    error={errors.firstName}
                    placeholder="First name"
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Last Name"
                    value={formData.lastName}
                    onChangeText={(v) => handleChange("lastName", v)}
                    error={errors.lastName}
                    placeholder="Last name"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <FormField
                label="Username"
                value={formData.username}
                onChangeText={(v) => handleChange("username", v)}
                error={errors.username}
                placeholder="Enter username"
              />

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

              <PasswordInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(v) => handleChange("confirmPassword", v)}
                error={errors.confirmPassword}
                placeholder="Confirm password"
              />

              <SubmitButton text="Register" onPress={handleSubmit} />
              <Divider />
            </View>
          </FormCard>
        </ScrollView>

        <AuthSwitchLink
          question="Already have an account?"
          linkText="Login"
          onPress={() => navigation.navigate("Login")}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
