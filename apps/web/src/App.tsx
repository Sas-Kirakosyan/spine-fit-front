import { useState, useEffect, Suspense, lazy, useTransition } from "react";

// --- LAZY LOADED COMPONENTS ---
// Note: Using .then() to handle named exports from your files
import type { Exercise } from "@/types/exercise";
import type { Page } from "@/types/navigation";
import type {
  ExerciseSetRow,
  FinishedWorkoutSummary,
  SavedProgram,
  TrainingDay,
} from "@/types/workout";
import type { SwapDurationOption } from "@spinefit/shared";
import {
  loadPlanFromLocalStorage,
  savePlanToLocalStorage,
} from "@/storage/planStorage";
import { loadPlanSettings } from "@/types/planSettings";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import "@/utils/testWorkoutHistoryGenerator";
import { trackPageView, trackEvent } from "@/utils/analytics";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { retryPendingQuizSync } from "@/lib/quizStorage";

const PUBLIC_PAGES: Page[] = ["home", "login", "register"];

// --- LAZY LOADED COMPONENTS ---
// Note: Using .then() to handle named exports from your files
const HomePage = lazy(() => import("@/pages/HomePage/HomePage"));

const Registration = lazy(
  () => import("@/pages/RegistrationPage/Registration")
);
const Login = lazy(() => import("@/pages/LoginPage/Login"));
const WorkoutPage = lazy(() => import("@/pages/WorkoutPage/WorkoutPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage/ProgressPage"));
const ExerciseSetsPage = lazy(
  () => import("@/pages/WorkoutPage/ExerciseSetsPage")
);
const ExerciseDetails = lazy(() => import("@/pages/WorkoutPage/ExerciseHowTo"));
const ActiveWorkoutPage = lazy(
  () => import("@/pages/WorkoutPage/ActiveWorkoutPage")
);
const HistoryPage = lazy(() => import("@/pages/HistoryPage/HistoryPage"));
const AllExercisePage = lazy(
  () => import("@/pages/AllExercisePage/AllExercisePage")
);
const MyPlanPage = lazy(() => import("@/pages/MyPlanPage/MyPlanPage"));
const AvailableEquipmentPage = lazy(
  () => import("@/pages/MyPlanPage/AvailableEquipmentPage")
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage/ProfilePage"));
const AIPage = lazy(() => import("@/pages/AIPage/AIPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage/SettingsPage"));
const CreateProgramPage = lazy(
  () => import("@/pages/CreateWorkoutPage/CreateWorkoutPage")
);
const ExerciseProgressPage = lazy(
  () => import("@/pages/ProgressPage/ExerciseProgressPage")
);

const PAGE_TO_PATH: Record<Page, string> = {
  home: "/",
  login: "/login",
  register: "/register",
  workout: "/workout",
  progress: "/progress",
  history: "/history",
  profile: "/profile",
  ai: "/ai",
  exerciseSets: "/workout/exercise-sets",
  exerciseDetails: "/workout/exercise-details",
  activeWorkout: "/workout/active",
  allExercise: "/exercises",
  myPlan: "/my-plan",
  availableEquipment: "/my-plan/equipment",
  settings: "/settings",
  createProgram: "/create-program",
  exerciseProgress: "/progress/exercise",
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page])
) as Record<string, Page>;

function App() {
  const auth = useAuth();
  const [isPagePending, startPageTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const validPages: Page[] = [
      "home",
      "login",
      "register",
      "workout",
      "progress",
      "exerciseSets",
      "exerciseDetails",
      "activeWorkout",
      "history",
      "profile",
      "ai",
      "allExercise",
      "myPlan",
      "availableEquipment",
      "settings",
      "createProgram",
      "exerciseProgress",
    ];
    const pageFromPath = PATH_TO_PAGE[window.location.pathname] as
      | Page
      | undefined;
    const resolvedPage =
      pageFromPath ??
      (localStorage.getItem("currentPage") as Page | null) ??
      "home";
    const validResolved = validPages.includes(resolvedPage)
      ? resolvedPage
      : "home";
    // If the user has a generated plan, treat workout as home
    if (validResolved === "home" && localStorage.getItem("generatedPlan"))
      return "workout";
    return validResolved;
  });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [exerciseSetsMode, setExerciseSetsMode] = useState<
    "preWorkout" | "activeWorkout"
  >("preWorkout");
  const [completedExerciseIds, setCompletedExerciseIds] = useState<number[]>(
    []
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<
    Record<number, ExerciseSetRow[]>
  >({});
  const [exercisePainLevels, setExercisePainLevels] = useState<
    Record<number, number>
  >({});

  const [workoutHistory, setWorkoutHistory] = useState<
    FinishedWorkoutSummary[]
  >(() => {
    const savedHistory = localStorage.getItem("workoutHistory");
    if (!savedHistory) return [];
    try {
      const parsed = JSON.parse(savedHistory);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(() => {
    const savedExercises = localStorage.getItem("workoutExercises");
    if (!savedExercises) return [];
    try {
      const parsed = JSON.parse(savedExercises);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(
    () => {
      const saved = localStorage.getItem("completedWorkoutIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
  );

  const [createProgramDays, setCreateProgramDays] = useState<TrainingDay[]>([]);
  const [createProgramName, setCreateProgramName] = useState("");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [allExerciseReturnPage, setAllExerciseReturnPage] = useState<
    "workout" | "createProgram"
  >("workout");
  const [isCustomWorkoutMode, setIsCustomWorkoutMode] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<
    string | undefined
  >();
  const [selectedExerciseProgressId, setSelectedExerciseProgressId] = useState<
    number | null
  >(null);

  // Sync URL to initial page on first mount (no history entry added)
  useEffect(() => {
    window.history.replaceState(
      { page: currentPage },
      "",
      PAGE_TO_PATH[currentPage]
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as {
        page: Page;
        exercise?: Exercise;
        mode?: "preWorkout" | "activeWorkout";
        exerciseId?: number;
      } | null;
      if (!state?.page) return;

      setSelectedExercise(state.exercise ?? null);
      if (state.mode) setExerciseSetsMode(state.mode);
      setSelectedExerciseProgressId(state.exerciseId ?? null);

      startPageTransition(() => setCurrentPage(state.page));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  // Auth gating: redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (auth.status !== "unauthenticated") return;
    if (PUBLIC_PAGES.includes(currentPage)) return;
    window.history.replaceState({ page: "login" }, "", PAGE_TO_PATH["login"]);
    startPageTransition(() => setCurrentPage("login"));
  }, [auth.status, currentPage, startPageTransition]);

  // Retry any pending quiz sync whenever the user becomes authenticated
  const authUserId = auth.status === "authenticated" ? auth.user.id : null;
  useEffect(() => {
    if (!authUserId) return;
    retryPendingQuizSync(authUserId);
  }, [authUserId]);

  useEffect(() => {
    trackPageView(currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("workoutHistory", JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    localStorage.setItem("workoutExercises", JSON.stringify(workoutExercises));
  }, [workoutExercises]);

  useEffect(() => {
    localStorage.setItem(
      "completedWorkoutIds",
      JSON.stringify([...completedWorkoutIds])
    );
  }, [completedWorkoutIds]);

  const navigateToPage = (
    page: Page,
    historyState: Record<string, unknown> = {}
  ) => {
    window.history.pushState({ page, ...historyState }, "", PAGE_TO_PATH[page]);
    startPageTransition(() => setCurrentPage(page));
  };

  const navigateToHome = () => navigateToPage("home");
  const navigateToLogin = () => navigateToPage("login");
  const resetWorkoutState = () => {
    setCompletedExerciseIds([]);
    setExerciseLogs({});
    setExercisePainLevels({});
    setWorkoutStartTime(null);
  };

  const handleAddExercises = (exercises: Exercise[]) => {
    setWorkoutExercises((prev) => {
      const existingIds = new Set(prev.map((ex) => ex.id));
      const newExercises = exercises.filter((ex) => !existingIds.has(ex.id));
      if (newExercises.length > 0) {
        trackEvent("exercises_added", { count: newExercises.length });
      }
      return [...prev, ...newExercises];
    });

    try {
      const planString = localStorage.getItem("generatedPlan");
      if (planString) {
        const plan = JSON.parse(planString);
        const activeWorkout = getNextAvailableWorkout(
          plan,
          completedWorkoutIds
        );

        if (activeWorkout) {
          const workoutIndex = plan.workoutDays.findIndex(
            (day: any) =>
              day.dayNumber === activeWorkout.dayNumber &&
              day.dayName === activeWorkout.dayName
          );

          if (workoutIndex !== -1) {
            const existingExerciseIds = new Set(
              plan.workoutDays[workoutIndex].exercises.map((ex: any) => ex.id)
            );
            const newExercisesToAdd = exercises.filter(
              (ex) => !existingExerciseIds.has(ex.id)
            );

            if (newExercisesToAdd.length > 0) {
              plan.workoutDays[workoutIndex].exercises.push(
                ...newExercisesToAdd
              );
              localStorage.setItem("generatedPlan", JSON.stringify(plan));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating generated plan:", error);
    }
  };

  const navigateToWorkout = () => {
    resetWorkoutState();
    setIsCustomWorkoutMode(false);
    // replaceState makes workout the "floor" — back button won't go past it
    window.history.replaceState(
      { page: "workout" },
      "",
      PAGE_TO_PATH["workout"]
    );
    startPageTransition(() => setCurrentPage("workout"));
  };
  const navigateToProgress = () => navigateToPage("progress");
  const navigateToHistory = () => navigateToPage("history");
  const navigateToProfile = () => navigateToPage("profile");
  const navigateToAI = () => navigateToPage("ai");
  const navigateToAllExercise = () => {
    setAllExerciseReturnPage("workout");
    navigateToPage("allExercise");
  };
  const navigateToMyPlan = () => navigateToPage("myPlan");
  const navigateToAvailableEquipment = () =>
    navigateToPage("availableEquipment");
  const navigateToSettings = () => navigateToPage("settings");
  const navigateToExerciseProgress = (exerciseId: number) => {
    setSelectedExerciseProgressId(exerciseId);
    navigateToPage("exerciseProgress", { exerciseId });
  };
  const navigateToCreateProgram = () => {
    setCreateProgramDays([]);
    setCreateProgramName("");
    setEditingProgramId(undefined);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const handleSelectSavedProgram = (program: SavedProgram) => {
    trackEvent("program_selected", { program_id: program.id });
    const plan = {
      id: program.id,
      name: program.name,
      splitType: "CUSTOM",
      createdAt: program.createdAt,
      settings: loadPlanSettings(),
      workoutDays: program.days.map((day, i) => ({
        dayNumber: i + 1,
        dayName: day.name,
        muscleGroups: [
          ...new Set(day.exercises.flatMap((ex) => ex.muscle_groups)),
        ],
        exercises: day.exercises,
      })),
      missingMuscleGroups: [],
      alternativeExercises: [],
    };
    localStorage.setItem("generatedPlan", JSON.stringify(plan));
    setCompletedWorkoutIds(new Set());
    setIsCustomWorkoutMode(false);
    resetWorkoutState();
    navigateToPage("workout");
  };

  const handleEditSavedProgram = (program: SavedProgram) => {
    trackEvent("program_edit_started", { program_id: program.id });
    setCreateProgramDays(program.days);
    setCreateProgramName(program.name);
    setEditingProgramId(program.id);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const navigateToActiveWorkout = (options?: { resetCompleted?: boolean }) => {
    trackEvent("workout_started");
    if (options?.resetCompleted !== false) {
      setCompletedExerciseIds([]);
      setExerciseLogs({});
    }
    setWorkoutStartTime((prevStartTime) => prevStartTime ?? Date.now());
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const navigateToExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    navigateToPage("exerciseDetails", { exercise });
  };

  const navigateToExerciseSets = (
    exercise: Exercise,
    mode: "preWorkout" | "activeWorkout" = "preWorkout"
  ) => {
    setSelectedExercise(exercise);
    setExerciseSetsMode(mode);
    navigateToPage("exerciseSets", { exercise, mode });
  };

  const backFromExerciseDetails = () => {
    window.history.back();
  };

  const backFromExerciseSets = () => {
    window.history.back();
  };

  const handleReplaceSelectedExercise = (
    oldExercise: Exercise,
    selectedReplacement: Exercise,
    duration: SwapDurationOption
  ) => {
    const replacement: Exercise = {
      ...selectedReplacement,
      sets: oldExercise.sets,
      reps: oldExercise.reps,
      weight: oldExercise.weight,
      weight_unit: oldExercise.weight_unit,
    };
    const replaceInList = (list: Exercise[]) => {
      if (
        list.some(
          (ex) => ex.id === replacement.id && ex.id !== oldExercise.id
        )
      ) {
        return list;
      }
      return list.map((ex) =>
        ex.id === oldExercise.id ? replacement : ex
      );
    };

    try {
      const plan = loadPlanFromLocalStorage();
      if (plan) {
        if (duration === "plan") {
          plan.workoutDays = plan.workoutDays.map((day) => ({
            ...day,
            exercises: replaceInList(day.exercises as Exercise[]),
          }));
        } else {
          const manualIndex = localStorage.getItem("selectedWorkoutDayIndex");
          let workoutIndex = -1;
          if (manualIndex !== null) {
            const idx = parseInt(manualIndex, 10);
            if (!isNaN(idx) && idx < plan.workoutDays.length) {
              workoutIndex = idx;
            }
          }
          if (workoutIndex === -1) {
            const currentWorkout = getNextAvailableWorkout(
              plan,
              completedWorkoutIds
            );
            if (currentWorkout) {
              workoutIndex = plan.workoutDays.findIndex(
                (day) =>
                  day.dayNumber === currentWorkout.dayNumber &&
                  day.dayName === currentWorkout.dayName
              );
            }
          }
          if (workoutIndex !== -1) {
            plan.workoutDays[workoutIndex].exercises = replaceInList(
              plan.workoutDays[workoutIndex].exercises as Exercise[]
            );
          }
        }
        savePlanToLocalStorage(plan);
      }
    } catch (error) {
      console.error("Error replacing exercise from sets page:", error);
    }

    setWorkoutExercises((prev) => replaceInList(prev));
    setSelectedExercise(replacement);
    trackEvent("exercise_replaced", {
      old_id: oldExercise.id,
      new_id: replacement.id,
      duration,
    });
  };

  const markExerciseComplete = (
    exerciseId: number,
    sets: ExerciseSetRow[],
    painLevel: number | undefined
  ) => {
    trackEvent("exercise_completed", { exercise_id: exerciseId });
    const completedSets = sets
      .filter((s) => s.completed)
      .map((s) => ({ ...s }));
    setExerciseLogs((prev) => ({ ...prev, [exerciseId]: completedSets }));
    if (painLevel !== undefined) {
      setExercisePainLevels((prev) => ({ ...prev, [exerciseId]: painLevel }));
    }
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const skipExercise = (exerciseId: number) => {
    trackEvent("exercise_skipped", { exercise_id: exerciseId });
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const handleFinishWorkout = (summary?: FinishedWorkoutSummary) => {
    trackEvent("workout_finished", { has_summary: !!summary });
    if (summary) {
      setWorkoutHistory((prev) => [...prev, summary]);
      resetWorkoutState();
      navigateToPage("workout");
      return;
    }
    resetWorkoutState();
    navigateToPage("workout");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "login":
        return (
          <Login
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "register":
        return (
          <Registration
            onSwitchToLogin={navigateToLogin}
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "workout":
        return (
          <WorkoutPage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="workout"
            onOpenExerciseDetails={navigateToExerciseDetails}
            onOpenExerciseSets={navigateToExerciseSets}
            onStartWorkoutSession={navigateToActiveWorkout}
            onNavigateToAllExercise={navigateToAllExercise}
            onNavigateToMyPlan={navigateToMyPlan}
            onCreateProgramFromScratch={navigateToCreateProgram}
            onSelectSavedProgram={handleSelectSavedProgram}
            onEditSavedProgram={handleEditSavedProgram}
            exercises={workoutExercises}
            isCustomWorkout={isCustomWorkoutMode}
            onRemoveExercise={(id: number) =>
              setWorkoutExercises((prev) => prev.filter((ex) => ex.id !== id))
            }
            completedWorkoutIds={completedWorkoutIds}
          />
        );
      case "progress":
        return (
          <ProgressPage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            onExerciseClick={navigateToExerciseProgress}
            activePage="progress"
            workoutHistory={workoutHistory}
          />
        );
      case "exerciseSets":
        if (!selectedExercise) {
          navigateToWorkout();
          return null;
        }
        return (
          <ExerciseSetsPage
            exercise={selectedExercise}
            onNavigateBack={backFromExerciseSets}
            onStartWorkoutSession={navigateToActiveWorkout}
            onNavigateToHistory={navigateToHistory}
            onMarkExerciseComplete={markExerciseComplete}
            onSkipExercise={skipExercise}
            isDuringActiveWorkout={exerciseSetsMode === "activeWorkout"}
            exerciseLogs={exerciseLogs}
            workoutHistory={workoutHistory}
            onReplaceExercise={handleReplaceSelectedExercise}
          />
        );
      case "exerciseDetails":
        if (!selectedExercise) {
          navigateToWorkout();
          return null;
        }
        return (
          <ExerciseDetails
            exercise={selectedExercise}
            onNavigateBack={backFromExerciseDetails}
            onStartWorkout={navigateToExerciseSets}
          />
        );
      case "activeWorkout":
        return (
          <ActiveWorkoutPage
            onNavigateBack={navigateToWorkout}
            onOpenExerciseSets={(ex) =>
              navigateToExerciseSets(ex, "activeWorkout")
            }
            onFinishWorkout={handleFinishWorkout}
            completedExerciseIds={completedExerciseIds}
            workoutStartTime={workoutStartTime || undefined}
            exerciseLogs={exerciseLogs}
            exercisePainLevels={exercisePainLevels}
            completedWorkoutIds={completedWorkoutIds}
            setCompletedWorkoutIds={setCompletedWorkoutIds}
            customExercises={isCustomWorkoutMode ? workoutExercises : undefined}
            isCustomWorkout={isCustomWorkoutMode}
          />
        );
      case "history":
        return (
          <HistoryPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="history"
            workouts={workoutHistory}
          />
        );
      case "profile":
        return (
          <ProfilePage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            onNavigateToSettings={navigateToSettings}
            activePage="profile"
          />
      );
      case "ai":
        return (
          <AIPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="ai"
          />
        );
      case "allExercise":
        return (
          <AllExercisePage
            onClose={() =>
              allExerciseReturnPage === "createProgram"
                ? navigateToPage("createProgram")
                : navigateToWorkout()
            }
            onAddExercises={(exercises) => {
              if (allExerciseReturnPage === "createProgram" && activeDayId) {
                setCreateProgramDays((prev) =>
                  prev.map((day) => {
                    if (day.id !== activeDayId) return day;
                    const existingIds = new Set(
                      day.exercises.map((ex) => ex.id)
                    );
                    return {
                      ...day,
                      exercises: [
                        ...day.exercises,
                        ...exercises.filter((ex) => !existingIds.has(ex.id)),
                      ],
                    };
                  })
                );
              } else {
                handleAddExercises(exercises);
              }
            }}
          />
        );
      case "createProgram":
        return (
          <CreateProgramPage
            days={createProgramDays}
            programName={createProgramName}
            onNavigateBack={navigateToWorkout}
            onAddExercise={(dayId) => {
              setActiveDayId(dayId);
              setAllExerciseReturnPage("createProgram");
              navigateToPage("allExercise");
            }}
            onSave={navigateToWorkout}
            onDaysChange={setCreateProgramDays}
            onProgramNameChange={setCreateProgramName}
            editProgramId={editingProgramId}
          />
        );
      case "myPlan":
        return (
          <MyPlanPage
            onNavigateBack={navigateToWorkout}
            onNavigateToAvailableEquipment={navigateToAvailableEquipment}
          />
        );
      case "availableEquipment":
        return <AvailableEquipmentPage onNavigateBack={navigateToMyPlan} />;
      case "exerciseProgress":
        if (!selectedExerciseProgressId) {
          navigateToProgress();
          return null;
        }
        return (
          <ExerciseProgressPage
            exerciseId={selectedExerciseProgressId}
            onNavigateBack={navigateToProgress}
            workoutHistory={workoutHistory}
          />
        );
      case "settings":
        return <SettingsPage onNavigateBack={navigateToProfile} />;
      default:
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
    }
  };

  if (auth.status === "loading") {
    return <PageLoader />;
  }

  return (
    <>
      {isPagePending ? <PageLoader className="pointer-events-none" /> : null}
      <Suspense fallback={<PageLoader className="pointer-events-none" />}>
        {renderPage()}
      </Suspense>
    </>
  );
}

export default App;
