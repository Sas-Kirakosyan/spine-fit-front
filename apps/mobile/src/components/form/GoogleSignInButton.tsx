import { useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { signInWithGoogle, type OAuthIntent } from "../../lib/authService";
import { GoogleIcon } from "../icons/Icons";

interface GoogleSignInButtonProps {
  label: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
  /**
   * "login" rejects the sign-in (and signs the user back out) when Google
   * authentication created a brand-new account, since the user never
   * registered. "register" lets the new account through. Defaults to
   * "register".
   */
  intent?: OAuthIntent;
}

export function GoogleSignInButton({
  label,
  onError,
  onSuccess,
  intent = "register",
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithGoogle(intent);
      if (result.ok) {
        onSuccess?.();
        return;
      }
      switch (result.reason) {
        case "cancelled":
          break;
        case "noAccount":
          onError?.(t("loginPage.errors.googleNoAccount"));
          break;
        case "alreadyRegistered":
          onError?.(t("loginPage.errors.googleAlreadyRegistered"));
          break;
        case "error":
          onError?.(result.message || t("loginPage.errors.unknown"));
          break;
      }
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : t("loginPage.errors.unknown")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`w-full flex-row items-center justify-center gap-3 rounded-[14px] border border-gray-300 bg-white py-3 shadow-sm ${
        loading ? "opacity-60" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#374151" />
      ) : (
        <GoogleIcon size={20} />
      )}
      <Text className="text-sm font-semibold text-gray-900">{label}</Text>
    </Pressable>
  );
}
