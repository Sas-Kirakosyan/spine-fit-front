import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/config";
import type { RegistrationFormData, RegistrationProps } from "../../types/auth";
import { PageContainer } from "../../layout/PageContainer";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { FormCard } from "../../components/Form/FormCard/FormCard";
import { FormHeader } from "../../components/Form/FormHeader/FormHeader";
import { FormField } from "../../components/Form/FormField/FormField";
import { PasswordInput } from "../../components/Form/PasswordInput/PasswordInput";
import { SubmitButton } from "../../components/Form/SubmitButton/SubmitButton";
import { Divider } from "../../components/Form/Divider/Divider";
import { GoogleAuthButton } from "../../components/Form/GoogleAuthButton/GoogleAuthButton";
import { AuthSwitchLink } from "../../components/Form/AuthSwitchLink/AuthSwitchLink";

export function Registration({
  onSwitchToLogin,
  onNavigateToHome,
  onNavigateToWorkout,
}: RegistrationProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof RegistrationFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must contain at least 3 characters";
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Password confirmation is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Registration data:", formData);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google registration successful:", user);
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    } catch (error: unknown) {
      console.error("Google registration error:", error);
    }
  };

  return (
    <PageContainer contentClassName="justify-between">
      <PageHeader onNavigateToHome={onNavigateToHome} />

      <div className="mt-8 flex-1 overflow-y-auto">
        <FormCard>
          <FormHeader title="Registration" subtitle="Create your account" />

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                placeholder="Enter first name"
              />

              <FormField
                label="Last Name"
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                placeholder="Enter last name"
              />
            </div>

            <FormField
              label="Username"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              placeholder="Enter username"
            />

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

            <PasswordInput
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="Confirm password"
            />

            <SubmitButton text="Register" />

            <Divider />

            <GoogleAuthButton
              onClick={handleGoogleSignUp}
              text="Registration with Google"
            />
          </form>
        </FormCard>
      </div>

      <AuthSwitchLink
        question="Already have an account?"
        linkText="Login"
        onClick={onSwitchToLogin || (() => {})}
      />
    </PageContainer>
  );
}
