import { useState } from "react";
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { FormCard } from "../components/form/FormCard";
import { FormHeader } from "../components/form/FormHeader";
import { RegistrationForm } from "../components/form/RegistrationForm";
import { GoogleSignInButton } from "../components/form/GoogleSignInButton";
import { Divider } from "../components/form/Divider";
import { AuthSwitchLink } from "../components/form/AuthSwitchLink";
import { Logo } from "../components/common/Logo";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [oauthError, setOauthError] = useState("");

  const navigateToMain = () => {
    navigation.getParent()?.navigate("Main");
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

        <ScrollView className="flex-1 mt-8" contentContainerStyle={{ paddingBottom: 20 }}>
          <FormCard>
            <FormHeader title={t("registrationPage.title")} subtitle={t("registrationPage.subtitle")} />

            <RegistrationForm
              submitLabel={t("registrationPage.register")}
              onSuccess={navigateToMain}
            />

            <View className="mt-5 gap-3">
              {oauthError ? (
                <Text
                  accessibilityRole="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
                >
                  {oauthError}
                </Text>
              ) : null}

              <GoogleSignInButton
                label={t("registrationPage.continueWithGoogle")}
                intent="register"
                onError={setOauthError}
                onSuccess={navigateToMain}
              />
            </View>

            <Divider />
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
