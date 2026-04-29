import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signInWithGoogle } from "@/lib/authService";
import { GoogleIcon } from "@/components/Icons/Icons";

interface GoogleSignInButtonProps {
  label: string;
  onError?: (message: string) => void;
}

const BASE_CLASSES =
  "w-full inline-flex items-center justify-center gap-3 rounded-[14px] border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

export function GoogleSignInButton({ label, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        onError?.(result.error.message || t("loginPage.errors.unknown"));
        setLoading(false);
      }
      // On success the browser is redirected to Google, so no further state update needed.
    } catch (err) {
      onError?.(err instanceof Error ? err.message : t("loginPage.errors.unknown"));
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={BASE_CLASSES}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}
