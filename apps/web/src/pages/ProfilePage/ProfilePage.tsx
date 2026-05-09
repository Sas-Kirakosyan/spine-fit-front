import { BottomNav } from "@/components/BottomNav/BottomNav.tsx";
import type { IProfilePageProps } from "@spinefit/shared/src/types/pages.ts";
import { Logo } from "@/components/Logo/Logo.tsx";
import { Button } from "@/components/Buttons/Button.tsx";
import { SettingsIcon } from "@/components/Icons/Icons.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import InputField from "@/components/InputField/InputField.tsx";
import ErrorIcon from "@/assets/ErrorIcon/ErrorIncon.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import {
  getPlanSettings,
  hasPlan,
  savePlanSettings,
  savePlanAndSettings,
  subscribe as subscribeToPlan,
} from "@/lib/planService.ts";
import type { GeneratedPlan } from "@spinefit/shared";
import { ConfirmDialog } from "@/components/ui/Modal.tsx";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader.tsx";

const PAIN_STATUS_OPTIONS = ["Healthy", "Recovered", "Active Symptoms"] as const;
type PainStatus = (typeof PAIN_STATUS_OPTIONS)[number];

const PAIN_LOCATION_OPTIONS = [
  "Lower Back (L4-L5/S1 area)",
  "Sciatica (Pain radiating down leg)",
  "Glute / Deep Hip discomfort",
  "Calf or Foot (Numbness/Tingling)",
] as const;

const PAIN_TRIGGER_OPTIONS = [
  "Bending forward (e.g., reaching for the floor)",
  "Arching backward (e.g., reaching overhead)",
  "Lifting or carrying heavy objects",
  "Sitting for longer than 20–30 minutes",
  "Impact movements (Running, Jumping)",
  "Rotating or twisting the torso",
  "Straining (Heavy bracing/holding breath)",
] as const;

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function ChipGrid({
  options,
  selected,
  onToggle,
  getLabel = (v) => v,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  getLabel?: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-main text-white"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            {getLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

function PainLevelSlider({
  value,
  onChange,
  labelNone,
  labelSevere,
}: {
  value: number;
  onChange: (v: number) => void;
  labelNone: string;
  labelSevere: string;
}) {
  const pct = (value / 10) * 100;
  const trackColor =
    value <= 3
      ? "#22c55e"
      : value <= 6
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${trackColor} ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
          }}
        />
        <span
          className="text-lg font-bold w-7 text-right"
          style={{ color: trackColor }}
        >
          {value}
        </span>
      </div>
      <div className="flex justify-between text-xs text-white/40">
        <span>{labelNone}</span>
        <span>{labelSevere}</span>
      </div>
    </div>
  );
}

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

  // Body measurements
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");

  // Spine health
  const [painStatus, setPainStatus] = useState<PainStatus | "">("");
  const [painLocation, setPainLocation] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [painTriggers, setPainTriggers] = useState<string[]>([]);

  // Snapshot of what was in planSettings when the page opened (to detect changes)
  const initialSpineRef = useRef({
    painStatus: "",
    painLocation: [] as string[],
    painTriggers: [] as string[],
  });

  // UI state
  const [savedToast, setSavedToast] = useState(false);
  const [regenDialogKind, setRegenDialogKind] = useState<"critical" | "soft" | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [apiPhase, setApiPhase] = useState<"pending" | "success">("pending");
  const [regenError, setRegenError] = useState<string | null>(null);

  const auth = useAuth();
  const userEmail =
    auth.status === "authenticated" ? (auth.user.email ?? "") : "";

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateHeight = useCallback(
    (h: number, unit: "cm" | "ft") => {
      if (!h || String(h).trim() === "") return "";
      if (unit === "cm" && (h > 272 || h < 50))
        return t("profilePage.errors.height.rangeCm");
      if (unit === "ft" && (h > 9.8 || h < 1.65))
        return t("profilePage.errors.height.rangeFt");
      return "";
    },
    [t]
  );

  const validateWeight = useCallback(
    (w: number, unit: "kg" | "lbs") => {
      if (!w || String(w).trim() === "") return "";
      if (unit === "kg" && (w > 300 || w < 40))
        return t("profilePage.errors.weight.rangeKg");
      if (unit === "lbs" && (w > 661 || w < 85))
        return t("profilePage.errors.weight.rangeLbs");
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

  // ── Load saved data ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Body measurements from localStorage
    const stored = localStorage.getItem("bodyProfile");
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        if (profile.height) setHeight(profile.height);
        if (profile.weight) setWeight(profile.weight);
        if (profile.units?.height) setHeightUnit(profile.units.height);
        if (profile.units?.weight) setWeightUnit(profile.units.weight);
        if (
          profile.gender !== undefined ||
          profile.dateOfBirth !== undefined ||
          profile.birthYear !== undefined
        ) {
          const { height: h, weight: w, units } = profile;
          localStorage.setItem(
            "bodyProfile",
            JSON.stringify({ height: h, weight: w, units })
          );
        }
      } catch {
        // ignore malformed data
      }
    }

    const loadSpineFromSettings = () => {
      const settings = getPlanSettings();
      const ps = (settings.painStatus ?? "") as PainStatus | "";
      const pl = settings.painLocation ?? [];
      const pt = settings.painTriggers ?? [];
      const plv = settings.painLevel ?? 0;

      setPainStatus(ps);
      setPainLocation(pl);
      setPainLevel(plv);
      setPainTriggers(pt);

      initialSpineRef.current = {
        painStatus: ps,
        painLocation: pl,
        painTriggers: pt,
      };
    };

    // Initial sync — may read defaults if Supabase hasn't returned yet on a
    // hard reload, in which case the subscriber below resyncs on first arrival.
    loadSpineFromSettings();
    let initialized = hasPlan();

    const unsubscribe = subscribeToPlan(() => {
      if (initialized) return;
      if (!hasPlan()) return;
      initialized = true;
      loadSpineFromSettings();
    });

    return unsubscribe;
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (heightError || weightError) return;

    // Persist body measurements
    localStorage.setItem(
      "bodyProfile",
      JSON.stringify({
        height,
        weight,
        units: { height: heightUnit, weight: weightUnit },
      })
    );

    // Detect what changed vs initial load
    const init = initialSpineRef.current;
    const statusChanged = painStatus !== init.painStatus;
    const locationChanged =
      JSON.stringify([...painLocation].sort()) !==
      JSON.stringify([...init.painLocation].sort());
    const triggersChanged =
      JSON.stringify([...painTriggers].sort()) !==
      JSON.stringify([...init.painTriggers].sort());

    // Persist spine health into planSettings. When the user commits to
    // "Healthy", the pain arrays are nulled out in storage even if they are
    // still populated in component state (we keep state around so toggling
    // status doesn't lose user input until they actually save).
    const isHealthy = painStatus === "Healthy";
    const currentSettings = getPlanSettings();
    savePlanSettings({
      ...currentSettings,
      painStatus: painStatus || undefined,
      painLocation: !isHealthy && painLocation.length ? painLocation : undefined,
      painLevel: painStatus === "Active Symptoms" ? painLevel : undefined,
      painTriggers: !isHealthy && painTriggers.length ? painTriggers : undefined,
    });

    // Update snapshot so subsequent saves compare correctly
    initialSpineRef.current = {
      painStatus,
      painLocation,
      painTriggers,
    };

    // Determine which dialog to show (critical takes priority over soft)
    if (statusChanged || locationChanged) {
      setRegenDialogKind("critical");
      return;
    }
    if (triggersChanged) {
      setRegenDialogKind("soft");
      return;
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // ── Plan regeneration ─────────────────────────────────────────────────────────

  const handleRegeneratePlan = async () => {
    setRegenDialogKind(null);
    setIsRegenerating(true);
    setApiPhase("pending");

    setRegenError(null);
    try {
      const settings = getPlanSettings();
      const response = await fetch(
        `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = (await response.json()) as {
        success: boolean;
        plan: GeneratedPlan;
      };
      if (result.success && result.plan) {
        savePlanAndSettings(result.plan);
        setApiPhase("success");
        return;
      }
      throw new Error("invalid_plan_payload");
    } catch {
      setIsRegenerating(false);
      setRegenError(t("profilePage.regenErrorMessage", "Failed to regenerate plan. Please try again."));
    }
  };

  const handleLoaderComplete = () => {
    setIsRegenerating(false);
    setApiPhase("pending");
    onNavigateToWorkout();
  };

  const handleRegenDialogLater = () => {
    setRegenDialogKind(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // ── Conditional visibility ────────────────────────────────────────────────────

  const showPainDetails = painStatus === "Recovered" || painStatus === "Active Symptoms";
  const showPainLevel = painStatus === "Active Symptoms";
  const hasError = !!(heightError || weightError);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isRegenerating) {
    return (
      <PlanGeneratingLoader
        apiPhase={apiPhase}
        onAllStepsComplete={handleLoaderComplete}
      />
    );
  }

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
          <p className="text-white/50 text-xs mb-0.5">{t("profilePage.account")}</p>
          <p className="text-white text-sm font-medium truncate">{userEmail}</p>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-y-auto pb-20">
        <div className="flex flex-col px-4 pt-4 gap-6 md:max-w-[800px] md:mx-auto md:w-full">

          {/* ── Spine Health Section ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-1">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                {t("profilePage.spineHealth")}
              </p>
              <p className="text-white/30 text-xs">
                {t("profilePage.spineHealthSubtitle")}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-5">

              {/* Back Health Status */}
              <div className="flex flex-col gap-2">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  {t("profilePage.backHealthStatusLabel")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PAIN_STATUS_OPTIONS.map((status) => {
                    const labelKey =
                      status === "Healthy"
                        ? "profilePage.statusHealthy"
                        : status === "Recovered"
                          ? "profilePage.statusRecovered"
                          : "profilePage.statusActive";
                    const active = painStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setPainStatus(status)}
                        className={`flex-1 min-w-[90px] py-2 rounded-xl text-sm font-semibold transition-colors ${
                          active
                            ? "bg-main text-white"
                            : "bg-white/10 text-white/50 hover:bg-white/15"
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pain Location — shown when not Healthy */}
              {showPainDetails && (
                <div className="flex flex-col gap-2">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    {t("profilePage.painLocationLabel")}
                  </p>
                  <ChipGrid
                    options={PAIN_LOCATION_OPTIONS}
                    selected={painLocation}
                    onToggle={(v) => setPainLocation((prev) => toggleItem(prev, v))}
                    getLabel={(v) => {
                      const map: Record<string, string> = {
                        "Lower Back (L4-L5/S1 area)": t("profilePage.locationLowerBack"),
                        "Sciatica (Pain radiating down leg)": t("profilePage.locationSciatica"),
                        "Glute / Deep Hip discomfort": t("profilePage.locationGluteHip"),
                        "Calf or Foot (Numbness/Tingling)": t("profilePage.locationCalfFoot"),
                      };
                      return map[v] ?? v;
                    }}
                  />
                </div>
              )}

              {/* Pain Level — shown only for Active Symptoms */}
              {showPainLevel && (
                <div className="flex flex-col gap-2">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    {t("profilePage.painLevelLabel")}
                  </p>
                  <PainLevelSlider
                    value={painLevel}
                    onChange={setPainLevel}
                    labelNone={t("profilePage.painLevelNone")}
                    labelSevere={t("profilePage.painLevelSevere")}
                  />
                </div>
              )}

              {/* Pain Triggers — shown when not Healthy */}
              {showPainDetails && (
                <div className="flex flex-col gap-2">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    {t("profilePage.painTriggersLabel")}
                  </p>
                  <ChipGrid
                    options={PAIN_TRIGGER_OPTIONS}
                    selected={painTriggers}
                    onToggle={(v) => setPainTriggers((prev) => toggleItem(prev, v))}
                    getLabel={(v) => {
                      const map: Record<string, string> = {
                        "Bending forward (e.g., reaching for the floor)": t("profilePage.triggerBending"),
                        "Arching backward (e.g., reaching overhead)": t("profilePage.triggerArching"),
                        "Lifting or carrying heavy objects": t("profilePage.triggerLifting"),
                        "Sitting for longer than 20–30 minutes": t("profilePage.triggerSitting"),
                        "Impact movements (Running, Jumping)": t("profilePage.triggerImpact"),
                        "Rotating or twisting the torso": t("profilePage.triggerRotating"),
                        "Straining (Heavy bracing/holding breath)": t("profilePage.triggerStraining"),
                      };
                      return map[v] ?? v;
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Body Measurements Section ────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
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
                    <span><ErrorIcon /></span>
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
                    <span><ErrorIcon /></span>
                    {weightError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          <Button
            disabled={hasError}
            onClick={handleSave}
            className={`w-full md:w-auto md:self-end md:px-8 py-4 rounded-xl text-white font-semibold transition min-h-[48px] ${
              hasError
                ? "bg-[#b85c00] cursor-not-allowed opacity-70"
                : "bg-main"
            }`}
          >
            {t("profilePage.saveButton")}
          </Button>
        </div>
      </div>

      {/* Success toast */}
      {savedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg">
          {t("profilePage.savedSuccess")}
        </div>
      )}

      {/* Regeneration error toast */}
      {regenError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg">
          {regenError}
        </div>
      )}

      {/* Critical regeneration dialog (painStatus or painLocation changed) */}
      <ConfirmDialog
        isOpen={regenDialogKind === "critical"}
        onClose={handleRegenDialogLater}
        dismissable={false}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-lg font-bold">
              {t("profilePage.regenCriticalTitle")}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {t("profilePage.regenCriticalMessage")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRegeneratePlan}
              className="w-full py-3 rounded-xl bg-main text-white font-semibold"
            >
              {t("profilePage.regenNow")}
            </Button>
            <Button
              onClick={handleRegenDialogLater}
              className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-medium"
            >
              {t("profilePage.regenLater")}
            </Button>
          </div>
        </div>
      </ConfirmDialog>

      {/* Soft regeneration dialog (painTriggers changed) */}
      <ConfirmDialog
        isOpen={regenDialogKind === "soft"}
        onClose={handleRegenDialogLater}
        dismissable={false}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-lg font-bold">
              {t("profilePage.regenSoftTitle")}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {t("profilePage.regenSoftMessage")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRegeneratePlan}
              className="w-full py-3 rounded-xl bg-main text-white font-semibold"
            >
              {t("profilePage.regenNow")}
            </Button>
            <Button
              onClick={handleRegenDialogLater}
              className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-medium"
            >
              {t("profilePage.regenLater")}
            </Button>
          </div>
        </div>
      </ConfirmDialog>

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
