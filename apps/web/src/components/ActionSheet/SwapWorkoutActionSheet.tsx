import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import type { GeneratedPlan } from "@spinefit/shared";
import { getPlan, subscribe as subscribeToPlan } from "@/lib/planService";
import type { SavedProgram } from "@/types/workout";

interface SwapWorkoutActionSheetProps {
  onClose: () => void;
  currentWorkout?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onSelectWorkout?: (workout: string) => void;
  onSwitchSplit?: (plan: GeneratedPlan) => void;
  onCreateFromScratch?: () => void;
  onSelectSavedProgram?: (program: SavedProgram) => void;
  onEditSavedProgram?: (program: SavedProgram) => void;
  onSelectPlanDay?: (dayIndex: number) => void;
}

const customWorkoutOptions = [
  {
    id: "create-scratch",
    nameKey: "swapWorkoutActionSheet.createFromScratch",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-main"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: "saved-programs",
    nameKey: "swapWorkoutActionSheet.savedPrograms",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function loadSavedPrograms(): SavedProgram[] {
  try {
    const data = localStorage.getItem("savedPrograms");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistSavedPrograms(programs: SavedProgram[]) {
  localStorage.setItem("savedPrograms", JSON.stringify(programs));
}

export function SwapWorkoutActionSheet({
  onClose,
  onSelectWorkout,
  onCreateFromScratch,
  onSelectSavedProgram,
  onEditSavedProgram,
  onSelectPlanDay,
}: SwapWorkoutActionSheetProps) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [view, setView] = useState<"main" | "savedPrograms">("main");
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Current day index — prefer manually selected day (if not completed), fallback to rotation
  const currentDayIndex = useMemo(() => {
    if (!plan) return 0;
    try {
      const completedIds: string[] = JSON.parse(
        localStorage.getItem("completedWorkoutIds") || "[]"
      );
      const completedSet = new Set(completedIds);

      const manual = localStorage.getItem("selectedWorkoutDayIndex");
      if (manual !== null) {
        const idx = parseInt(manual, 10);
        if (!isNaN(idx) && idx < plan.workoutDays.length) {
          const day = plan.workoutDays[idx];
          const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
          if (!completedSet.has(workoutId)) return idx;
        }
      }

      const count = completedIds.filter((id) => id.startsWith(plan.id)).length;
      const baseIndex = count % plan.workoutDays.length;

      // If the rotation index is completed, find the next uncompleted day
      for (let i = 0; i < plan.workoutDays.length; i++) {
        const idx = (baseIndex + i) % plan.workoutDays.length;
        const d = plan.workoutDays[idx];
        const wId = `${plan.id}_${d.dayNumber}_${d.dayName}`;
        if (!completedSet.has(wId)) return idx;
      }
      return baseIndex;
    } catch {
      return 0;
    }
  }, [plan]);

  // Set of completed workout IDs for visual marking
  const completedWorkoutIds = useMemo<Set<string>>(() => {
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem("completedWorkoutIds") || "[]"
      );
      return new Set(ids);
    } catch {
      return new Set();
    }
  }, []);

  // Load plan on mount + re-sync whenever the plan cache updates
  useEffect(() => {
    const syncFromCache = () => {
      const loadedPlan = getPlan();
      setPlan(loadedPlan);
    };
    syncFromCache();
    const unsubscribe = subscribeToPlan(syncFromCache);
    return unsubscribe;
  }, []);

  const openSavedPrograms = useCallback(() => {
    setSavedPrograms(loadSavedPrograms());
    setActionMenuId(null);
    setView("savedPrograms");
  }, []);

  const handleDeleteSaved = useCallback((id: string) => {
    setSavedPrograms((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistSavedPrograms(updated);
      return updated;
    });
    setActionMenuId(null);
  }, []);

  const handleDuplicateSaved = useCallback((program: SavedProgram) => {
    const duplicate: SavedProgram = {
      ...program,
      id: `program-${Date.now()}`,
      name: `${program.name} ${t("swapWorkoutActionSheet.copySuffix")}`,
      createdAt: new Date().toISOString(),
      days: program.days.map((day) => ({
        ...day,
        id: `day-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exercises: day.exercises.map((ex) => ({ ...ex })),
      })),
    };
    setSavedPrograms((prev) => {
      const updated = [...prev, duplicate];
      persistSavedPrograms(updated);
      return updated;
    });
    setActionMenuId(null);
  }, [t]);

  const sheetContent = (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        role="button"
        tabIndex={-1}
        aria-label={t("swapWorkoutActionSheet.closeActionSheet")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div className="relative z-50 w-full max-w-[440px] mx-auto">
        <div className="bg-[#161827] min-h-[300px] max-h-[85vh] border-t rounded-t-[30px] flex flex-col">
          <div className="flex justify-center pt-4">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="px-5 pb-8 pt-4 sm:px-6 flex-1 overflow-y-auto">
            {view === "savedPrograms" ? (
              <SavedProgramsView
                programs={savedPrograms}
                actionMenuId={actionMenuId}
                onBack={() => {
                  setView("main");
                  setActionMenuId(null);
                }}
                onSelect={(p) => {
                  onSelectSavedProgram?.(p);
                  onClose();
                }}
                onEdit={(p) => {
                  onEditSavedProgram?.(p);
                  onClose();
                }}
                onDelete={handleDeleteSaved}
                onDuplicate={handleDuplicateSaved}
                onToggleMenu={(id) => setActionMenuId(actionMenuId === id ? null : id)}
              />
            ) : (
              <>
                <h2 className="text-2xl text-center font-bold text-white mb-6">
                  {t("swapWorkoutActionSheet.title")}
                </h2>

                {/* Weekly Training Plan Section */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
                    {t("swapWorkoutActionSheet.weeklyPlan")}
                  </h3>
                  {plan && (
                    <>
                      <p className="text-xs text-white/50 mb-3">{plan.name}</p>
                      <div className="space-y-2">
                        {plan.workoutDays.map((day, index) => {
                          const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
                          const isCompleted = completedWorkoutIds.has(workoutId);
                          return (
                          <button
                            key={index}
                            disabled={isCompleted}
                            onClick={() => {
                              onSelectPlanDay?.(index);
                              onClose();
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                              isCompleted
                                ? "bg-green-900/20 border border-green-500/60 opacity-60 cursor-not-allowed"
                                : "bg-gray-800/50 hover:bg-gray-800/70"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? "bg-green-500/20" : "bg-main/10"
                            }`}>
                              {isCompleted ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              ) : (
                                <span className="text-main text-xs font-bold">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isCompleted ? "text-green-300/80" : "text-white"}`}>{day.dayName}</p>
                              {day.muscleGroups.length > 0 && (
                                <p className={`text-xs truncate ${isCompleted ? "text-green-400/40" : "text-white/40"}`}>
                                  {day.muscleGroups.slice(0, 3).join(" · ")}
                                </p>
                              )}
                            </div>
                            {isCompleted ? (
                              <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full flex-shrink-0">
                                {t("swapWorkoutActionSheet.completed")}
                              </span>
                            ) : currentDayIndex === index ? (
                              <span className="text-[10px] font-semibold text-main bg-main/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                {t("swapWorkoutActionSheet.current")}
                              </span>
                            ) : null}
                            <svg
                              className={`h-4 w-4 flex-shrink-0 ${isCompleted ? "text-green-500/30" : "text-white/30"}`}
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 4l4 4-4 4" />
                            </svg>
                          </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom Workout Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
                    {t("swapWorkoutActionSheet.customWorkout")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {customWorkoutOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (option.id === "create-scratch" && onCreateFromScratch) {
                            onCreateFromScratch();
                            onClose();
                            return;
                          }
                          if (option.id === "saved-programs") {
                            openSavedPrograms();
                            return;
                          }
                          if (onSelectWorkout) {
                            onSelectWorkout(option.id);
                          }
                          onClose();
                        }}
                        className="flex flex-col items-start gap-1 p-1 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          {option.icon}
                        </div>
                        <span className="text-white text-sm font-medium text-left">
                          {t(option.nameKey)}
                        </span>
                        <svg
                          className="ml-auto h-4 w-4 text-white/60"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 4l4 4-4 4" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}

/* ------------------------------------------------------------------ */

interface SavedProgramsViewProps {
  programs: SavedProgram[];
  actionMenuId: string | null;
  onBack: () => void;
  onSelect: (program: SavedProgram) => void;
  onEdit: (program: SavedProgram) => void;
  onDelete: (id: string) => void;
  onDuplicate: (program: SavedProgram) => void;
  onToggleMenu: (id: string) => void;
}

function SavedProgramsView({
  programs,
  actionMenuId,
  onBack,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleMenu,
}: SavedProgramsViewProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-white/70 hover:text-white hover:bg-gray-700/60 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">
          {t("swapWorkoutActionSheet.savedPrograms")}
        </h2>
        <span className="ml-auto text-xs text-white/40 font-medium">
          {programs.length}{" "}
          {programs.length === 1
            ? t("swapWorkoutActionSheet.program")
            : t("swapWorkoutActionSheet.programs")}
        </span>
      </div>

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/15 mb-3"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-white/40 text-sm">{t("swapWorkoutActionSheet.noSavedPrograms")}</p>
          <p className="text-white/25 text-xs mt-1">
            {t("swapWorkoutActionSheet.noSavedProgramsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {programs.map((program) => {
            const totalExercises = program.days.reduce((sum, day) => sum + day.exercises.length, 0);
            return (
              <div key={program.id} className="relative">
                <button
                  onClick={() => onSelect(program)}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-lg bg-main/10 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-main"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{program.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {program.days.length}{" "}
                      {program.days.length === 1
                        ? t("swapWorkoutActionSheet.day")
                        : t("swapWorkoutActionSheet.days")}
                      {" · "}
                      {totalExercises}{" "}
                      {totalExercises === 1
                        ? t("swapWorkoutActionSheet.exercise")
                        : t("swapWorkoutActionSheet.exercises")}
                      {" · "}
                      {new Date(program.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMenu(program.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onToggleMenu(program.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </div>
                </button>

                {actionMenuId === program.id && (
                  <div className="absolute right-2 top-full mt-1 z-50 w-40 rounded-xl bg-[#232640] border border-white/10 shadow-2xl overflow-hidden">
                    <button
                      onClick={() => onEdit(program)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {t("swapWorkoutActionSheet.edit")}
                    </button>
                    <button
                      onClick={() => onDuplicate(program)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {t("swapWorkoutActionSheet.duplicate")}
                    </button>
                    <button
                      onClick={() => onDelete(program.id)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {t("swapWorkoutActionSheet.delete")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
