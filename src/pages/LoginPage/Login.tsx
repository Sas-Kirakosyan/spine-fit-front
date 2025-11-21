import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/config";
import { PageContainer } from "../../layout/PageContainer";
import { FormCard } from "../../components/Form/FormCard/FormCard";
import { FormHeader } from "../../components/Form/FormHeader/FormHeader";
import { FormField } from "../../components/Form/FormField/FormField";
import { PasswordInput } from "../../components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "../../components/Form/SubmitButton/SubmitButton";
import { Divider } from "../../components/Form/Divider/Divider";
import { GoogleAuthButton } from "../../components/Form/GoogleAuthButton/GoogleAuthButton";
import { AuthSwitchLink } from "../../components/Form/AuthSwitchLink/AuthSwitchLink";
import { PageHeader } from "../../components/PageHeader/PageHeader";

import type { LoginFormData, LoginProps } from "../../types/auth";

export function Login({
  onSwitchToRegister,
  onNavigateToHome,
  onNavigateToWorkout,
}: LoginProps): JSX.Element {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must contain at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Login data:", formData);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google login successful:", user);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    } catch (error: unknown) {
      console.error("Google login error:", error);
    }
  };

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToHome} />

      <div className="mt-10 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader title="Login" subtitle="Sign in to your account" />

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter email"
            />

            <PasswordInput
              label="Password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Enter password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4"
                />
                Remember me
              </label>

              <a
                href="#"
                className="text-sm font-medium text-[#0000E7] transition hover:text-blue-400"
              >
                Forgot your password?
              </a>
            </div>

            <SubmitButton text="Sign In" />

            <Divider />

            <GoogleAuthButton
              onClick={handleGoogleSignIn}
              text="Login with Google"
            />
          </form>
        </FormCard>
      </div>

      <AuthSwitchLink
        question="Don't have an account?"
        linkText="Register"
        onClick={onSwitchToRegister || (() => {})}
      />
    </PageContainer>
  );
}
