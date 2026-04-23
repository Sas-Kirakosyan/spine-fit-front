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
import { savePlanToLocalStorage } from "@/storage/planStorage.ts";
import { savePlanSettings } from "@/storage/planSettingsStorage.ts";
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
    auth.status === "authenticated" ? auth.user.email ?? "" : "";

  const persistProfile = () => {
    const stored = localStorage.getItem("quizAnswers");
    const quizData = stored
      ? JSON.parse(stored)
      : { answers: {}, units: {}, workoutType: "gym" };

    const bodyProfileData = {
      dateOfBirth,
      gender,
      height,
      weight,
      units: { height: heightUnit, weight: weightUnit },
    };
    localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));
    if (typeof quizData.answers[3] !== "object" || quizData.answers[3] === null)
      quizData.answers[3] = {};
    if (typeof quizData.units[3] !== "object" || quizData.units[3] === null)
      quizData.units[3] = {};

    if (gender) quizData.answers[3].gender = gender;
    if (dateOfBirth) quizData.answers[3].dateOfBirth = dateOfBirth;
    if (height) quizData.answers[3].height = height;
    if (weight) quizData.answers[3].weight = weight;
    quizData.units[3].height = heightUnit;
    quizData.units[3].weight = weightUnit;
    quizData.timestamp = new Date().toISOString();

    localStorage.setItem("quizAnswers", JSON.stringify(quizData));
    return quizData;
  };

  const doSave = () => {
    persistProfile();
    localStorage.removeItem("generatedPlan");
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const doSaveAndRegenerate = async () => {
    const quizData = persistProfile();
    setShowResetConfirm(false);
    setIsRegenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizData),
        }
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const result = (await response.json()) as {
        success: boolean;
        plan: Parameters<typeof savePlanToLocalStorage>[0];
        planSettings?: Parameters<typeof savePlanSettings>[0];
      };
      if (result.success && result.plan) {
        savePlanToLocalStorage(result.plan);
        if (result.planSettings) savePlanSettings(result.planSettings);
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
    const hasPlan = !!localStorage.getItem("generatedPlan");
    if (hasPlan) {
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
    const stored = localStorage.getItem("quizAnswers");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const raw3 = parsed.answers?.[3];
      const answers = (typeof raw3 === "object" && raw3 !== null) ? raw3 : {};
      const rawUnits3 = parsed.units?.[3];
      const units = (typeof rawUnits3 === "object" && rawUnits3 !== null) ? rawUnits3 : {};

      if (answers.gender) setGender(answers.gender);
      if (answers.dateOfBirth) setDateOfBirth(answers.dateOfBirth);
      if (answers.height) setHeight(answers.height);
      if (answers.weight) setWeight(answers.weight);

      if (units.height) setHeightUnit(units.height);
      if (units.weight) setWeightUnit(units.weight);

      const bodyProfileData = { ...answers, units };
      localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }, []);

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <h1 className="mx-2.5 text-3xl font-semibold text-white">
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
        <div className="flex flex-col px-4 pt-4 gap-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
            {t("profilePage.bodyMeasurements")}
          </p>

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

          <Button
            disabled={!!(heightError || weightError)}
            onClick={handleSave}
            className={`w-full py-4 rounded-xl text-white font-semibold transition mt-2
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

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-6 px-4">
          <div className="w-full max-w-[440px] bg-[#132f54] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">
                {t("profilePage.resetPlanTitle")}
              </h2>
              <p className="text-white/60 text-sm">
                {t("profilePage.resetPlanMessage")}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold"
              >
                {t("profilePage.resetPlanCancel")}
              </Button>
              <Button
                onClick={doSaveAndRegenerate}
                className="flex-1 py-3 rounded-xl bg-main text-white font-semibold"
              >
                {t("profilePage.resetPlanConfirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRegenerating && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/75">
          <div className="w-10 h-10 border-4 border-white/20 border-t-main rounded-full animate-spin mb-4" />
          <p className="text-white font-semibold text-base">
            {t("profilePage.regenerating")}
          </p>
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
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
