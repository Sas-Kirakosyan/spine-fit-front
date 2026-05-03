import { BottomNav } from "@/components/BottomNav/BottomNav.tsx";
import type { IProfilePageProps } from "@spinefit/shared/src/types/pages.ts";
import { Logo } from "@/components/Logo/Logo.tsx";
import { Button } from "@/components/Buttons/Button.tsx";
import { SettingsIcon } from "@/components/Icons/Icons.tsx";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectField from "@/components/SelecteField/SelecteField.tsx";
import InputField from "@/components/InputField/InputField.tsx";
import QuizScrollCalendar from "@/components/Quiz/QuizScrollCalendar.tsx";
import ErrorIcon from "@/assets/ErrorIcon/ErrorIncon.tsx";
import { ConfirmDialog } from "@/components/ui/Modal";
import { clearPlan, getPlanSettings, hasPlan, savePlanAndSettings } from "@/lib/planService";
import type { GeneratedPlan, PlanSettings } from "@spinefit/shared";
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

  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const auth = useAuth();
  const userEmail =
    auth.status === "authenticated" ? (auth.user.email ?? "") : "";

  const persistProfile = () => {
    const bodyProfileData = {
      dateOfBirth,
      gender,
      height,
      weight,
      units: { height: heightUnit, weight: weightUnit },
    };
    localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));
  };

  const doSave = () => {
    persistProfile();
    void clearPlan();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const doSaveAndRegenerate = async () => {
    persistProfile();
    setShowResetConfirm(false);
    setIsRegenerating(true);
    try {
      // Use the existing plan's settings (which has all quiz answers) as the
      // base and override only the profile fields edited on this page. This
      // ensures a full payload even when localStorage quiz answers are gone.
      const currentSettings = getPlanSettings();
      const mergedSettings: PlanSettings = {
        ...currentSettings,
        ...(gender ? { gender } : {}),
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(height ? { height } : {}),
        ...(weight ? { weight } : {}),
        heightUnit,
        weightUnit,
      };
      const response = await fetch(
        `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mergedSettings),
        }
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const result = (await response.json()) as {
        success: boolean;
        plan: GeneratedPlan;
      };

      if (result.success && result.plan) {
        savePlanAndSettings(result.plan);
        onNavigateToWorkout();
        return;
      }
    } catch (err) {
      console.error("Failed to regenerate plan:", err);
    } finally {
      setIsRegenerating(false);
    }
    onNavigateToWorkout();
  };

  const handleSave = () => {
    if (heightError || weightError) return;
    if (hasPlan()) {
      setShowResetConfirm(true);
    } else {
      doSave();
    }
  };

  const validateHeight = useCallback(
    (height: number, unit: "cm" | "ft") => {
      if (!height || String(height).trim() === "") return "";

      if (unit === "cm") {
        if (height > 272 || height < 50)
          return t("profilePage.errors.height.rangeCm");
      }
      if (unit === "ft") {
        if (height > 9.8 || height < 1.65)
          return t("profilePage.errors.height.rangeFt");
      }
      return "";
    },
    [t]
  );

  const validateWeight = useCallback(
    (weight: number, unit: "kg" | "lbs") => {
      if (!weight || String(weight).trim() === "") return "";

      if (unit === "kg") {
        if (weight > 300 || weight < 40)
          return t("profilePage.errors.weight.rangeKg");
      }
      if (unit === "lbs") {
        if (weight > 661 || weight < 85)
          return t("profilePage.errors.weight.rangeLbs");
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
  }, [validateWeight, weight, weightUnit]);

  useEffect(() => {
    const stored = localStorage.getItem("bodyProfile");
    if (!stored) return;
    try {
      const profile = JSON.parse(stored);
      if (profile.gender) setGender(profile.gender);
      if (profile.dateOfBirth) setDateOfBirth(profile.dateOfBirth);
      if (profile.height) setHeight(profile.height);
      if (profile.weight) setWeight(profile.weight);
      if (profile.units?.height) setHeightUnit(profile.units.height);
      if (profile.units?.weight) setWeightUnit(profile.units.weight);
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }, []);

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
          <p className="text-white/50 text-xs mb-0.5">Account</p>
          <p className="text-white text-sm font-medium truncate">{userEmail}</p>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-y-auto pb-20">
        <div className="flex flex-col px-4 pt-4 gap-4 md:max-w-[800px] md:mx-auto md:w-full">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
            {t("profilePage.bodyMeasurements")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              value={gender}
              options={[
                t("profilePage.genders.male"),
                t("profilePage.genders.female"),
                t("profilePage.genders.other"),
              ]}
              onChange={setGender}
              placeholder={t("profilePage.placeholders.gender")}
            />

            <QuizScrollCalendar
              value={dateOfBirth}
              onChange={(newVal: string) => setDateOfBirth(newVal)}
            />

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
            disabled={!!(heightError || weightError)}
            onClick={handleSave}
            className={`w-full md:w-auto md:self-end md:px-8 py-4 rounded-xl text-white font-semibold transition mt-2 min-h-[48px]
                            ${
                              heightError || weightError
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

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        ariaLabel={t("profilePage.resetPlanTitle")}
        className="bg-[#132f54] border border-white/10"
      >
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-white font-semibold text-lg md:text-xl mb-1">
              {t("profilePage.resetPlanTitle")}
            </h2>
            <p className="text-white/60 text-sm">
              {t("profilePage.resetPlanMessage")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold min-h-[48px]"
            >
              {t("profilePage.resetPlanCancel")}
            </Button>
            <Button
              onClick={doSaveAndRegenerate}
              className="flex-1 py-3 rounded-xl bg-main text-white font-semibold min-h-[48px]"
            >
              {t("profilePage.resetPlanConfirm")}
            </Button>
          </div>
        </div>
      </ConfirmDialog>

      {isRegenerating && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/75">
          <div className="w-10 h-10 border-4 border-white/20 border-t-main rounded-full animate-spin mb-4" />
          <p className="text-white font-semibold text-base">
            {t("profilePage.regenerating")}
          </p>
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
