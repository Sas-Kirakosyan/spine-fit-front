import { BottomNav } from "@/components/BottomNav/BottomNav.tsx";
import type { IProfilePageProps } from "@spinefit/shared/src/types/pages.ts";
import { Logo } from "@/components/Logo/Logo.tsx";
import { Button } from "@/components/Buttons/Button.tsx";
import { SettingsIcon } from "@/components/Icons/Icons.tsx";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import InputField from "@/components/InputField/InputField.tsx";
import ErrorIcon from "@/assets/ErrorIcon/ErrorIncon.tsx";
import { useAuth } from "@/hooks/useAuth.ts";

function ProfilePage({
  onNavigateToWorkout,
  onNavigateToProgress,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToAI,
  onNavigateToSettings,
  activePage,
}: IProfilePageProps) {
  const { t } = useTranslation();

  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const auth = useAuth();
  const userEmail =
    auth.status === "authenticated" ? (auth.user.email ?? "") : "";

  const handleSave = () => {
    if (heightError || weightError) return;
    localStorage.setItem(
      "bodyProfile",
      JSON.stringify({
        height,
        weight,
        units: { height: heightUnit, weight: weightUnit },
      })
    );
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const validateHeight = useCallback(
    (h: number, unit: "cm" | "ft") => {
      if (!h || String(h).trim() === "") return "";
      if (unit === "cm") {
        if (h > 272 || h < 50) return t("profilePage.errors.height.rangeCm");
      }
      if (unit === "ft") {
        if (h > 9.8 || h < 1.65)
          return t("profilePage.errors.height.rangeFt");
      }
      return "";
    },
    [t]
  );

  const validateWeight = useCallback(
    (w: number, unit: "kg" | "lbs") => {
      if (!w || String(w).trim() === "") return "";
      if (unit === "kg") {
        if (w > 300 || w < 40) return t("profilePage.errors.weight.rangeKg");
      }
      if (unit === "lbs") {
        if (w > 661 || w < 85) return t("profilePage.errors.weight.rangeLbs");
      }
      return "";
    },
    [t]
  );

  useEffect(() => {
    setHeightError(validateHeight(Number(height), heightUnit));
  }, [height, heightUnit, validateHeight]);

  useEffect(() => {
    setWeightError(validateWeight(Number(weight), weightUnit));
  }, [weight, weightUnit, validateWeight]);

  useEffect(() => {
    const stored = localStorage.getItem("bodyProfile");
    if (!stored) return;
    try {
      const profile = JSON.parse(stored);
      if (profile.height) setHeight(profile.height);
      if (profile.weight) setWeight(profile.weight);
      if (profile.units?.height) setHeightUnit(profile.units.height);
      if (profile.units?.weight) setWeightUnit(profile.units.weight);
      // Strip legacy keys from older bodyProfile shape
      if (profile.gender !== undefined || profile.dateOfBirth !== undefined || profile.birthYear !== undefined) {
        const { height: h, weight: w, units } = profile;
        localStorage.setItem("bodyProfile", JSON.stringify({ height: h, weight: w, units }));
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }, []);

  const hasError = !!(heightError || weightError);

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <h1 className="mx-2.5 text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
            {t("profilePage.title")}
          </h1>
        </div>
        <Button
          onClick={onNavigateToSettings}
          className="flex items-center gap-2 rounded-[14px] bg-white/10 mx-4 my-5"
        >
          <SettingsIcon />
        </Button>
      </header>

      {userEmail && (
        <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-xs mb-0.5">
            {t("profilePage.account")}
          </p>
          <p className="text-white text-sm font-medium truncate">{userEmail}</p>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-y-auto pb-20">
        <div className="flex flex-col px-4 pt-4 gap-4 md:max-w-[800px] md:mx-auto md:w-full">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
            {t("profilePage.bodyMeasurements")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <InputField
                value={height}
                onChange={setHeight}
                placeholder={t("profilePage.placeholders.height")}
                type="number"
                unit={heightUnit}
                unitOptions={["cm", "ft"]}
                onUnitChange={(u) => setHeightUnit(u as "cm" | "ft")}
              />
              {!!heightError && (
                <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <span>
                    <ErrorIcon />
                  </span>
                  {heightError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <InputField
                value={weight}
                onChange={setWeight}
                placeholder={t("profilePage.placeholders.weight")}
                type="number"
                unit={weightUnit}
                unitOptions={["kg", "lbs"]}
                onUnitChange={(u) => setWeightUnit(u as "kg" | "lbs")}
              />
              {!!weightError && (
                <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <span>
                    <ErrorIcon />
                  </span>
                  {weightError}
                </p>
              )}
            </div>
          </div>

          <Button
            disabled={hasError}
            onClick={handleSave}
            className={`w-full md:w-auto md:self-end md:px-8 py-4 rounded-xl text-white font-semibold transition mt-2 min-h-[48px] ${
              hasError
                ? "bg-[#b85c00] cursor-not-allowed opacity-70"
                : "bg-main"
            }`}
          >
            {t("profilePage.saveButton")}
          </Button>
        </div>
      </div>

      {savedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg">
          {t("profilePage.savedSuccess")}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] md:max-w-none">
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProgressClick={onNavigateToProgress}
          onHistoryClick={onNavigateToHistory}
          onProfileClick={onNavigateToProfile}
          onAIClick={onNavigateToAI}
        />
      </div>
    </div>
  );
}

export default ProfilePage;
