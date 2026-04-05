import { useState, useEffect, Suspense, lazy, useTransition } from "react";

// --- LAZY LOADED COMPONENTS ---
// Note: Using .then() to handle named exports from your files
const HomePage = lazy(() => import("@/pages/HomePage/HomePage"));

const Registration = lazy(() => import("@/pages/RegistrationPage/Registration"));
const Login = lazy(() => import("@/pages/LoginPage/Login"));
const WorkoutPage = lazy(() => import("@/pages/WorkoutPage/WorkoutPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage/ProgressPage"));
const ExerciseSetsPage = lazy(() => import("@/pages/WorkoutPage/ExerciseSetsPage"));
const ExerciseDetails = lazy(() => import("@/pages/WorkoutPage/ExerciseHowTo"));
const ActiveWorkoutPage = lazy(() => import("@/pages/WorkoutPage/ActiveWorkoutPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage/HistoryPage"));
const AllExercisePage = lazy(() => import("@/pages/AllExercisePage/AllExercisePage"));
const MyPlanPage = lazy(() => import("@/pages/MyPlanPage/MyPlanPage"));
const AvailableEquipmentPage = lazy(() => import("@/pages/MyPlanPage/AvailableEquipmentPage"));
const AIPage = lazy(() => import("@/pages/AIPage/AIPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage/SettingsPage"));
const CreateProgramPage = lazy(() => import("@/pages/CreateWorkoutPage/CreateWorkoutPage"));
const ExerciseProgressPage = lazy(() => import("@/pages/ProgressPage/ExerciseProgressPage"));

import type { Exercise } from "@/types/exercise";
import type { Page } from "@/types/navigation";
import type {
  ExerciseSetRow,
  FinishedWorkoutSummary,
  SavedProgram,
  TrainingDay,
} from "@/types/workout";
import { loadPlanSettings } from "@/types/planSettings";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import "@/utils/testWorkoutHistoryGenerator";
import { trackPageView } from "@/utils/analytics";
import { PageLoader } from "@/components/ui/PageLoader";

function App() {
  const [isPagePending, startPageTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem("currentPage") as Page | null;
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
      "ai",
      "allExercise",
      "myPlan",
      "availableEquipment",
      "settings",
      "createProgram",
      "exerciseProgress",
    ];
    return savedPage && validPages.includes(savedPage) ? savedPage : "home";
  });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseSetsMode, setExerciseSetsMode] = useState<"preWorkout" | "activeWorkout">(
    "preWorkout"
  );
  const [completedExerciseIds, setCompletedExerciseIds] = useState<number[]>([]);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<number, ExerciseSetRow[]>>({});
  const [exercisePainLevels, setExercisePainLevels] = useState<Record<number, number>>({});

  const [workoutHistory, setWorkoutHistory] = useState<FinishedWorkoutSummary[]>(() => {
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

  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("completedWorkoutIds");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [createProgramDays, setCreateProgramDays] = useState<TrainingDay[]>([]);
  const [createProgramName, setCreateProgramName] = useState("");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [allExerciseReturnPage, setAllExerciseReturnPage] = useState<"workout" | "createProgram">(
    "workout"
  );
  const [isCustomWorkoutMode, setIsCustomWorkoutMode] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | undefined>();
  const [selectedExerciseProgressId, setSelectedExerciseProgressId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

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
    localStorage.setItem("completedWorkoutIds", JSON.stringify([...completedWorkoutIds]));
  }, [completedWorkoutIds]);

  const navigateToPage = (page: Page) => {
    startPageTransition(() => setCurrentPage(page));
  };

  const navigateToHome = () => navigateToPage("home");
  const navigateToLogin = () => navigateToPage("login");
  const navigateToRegister = () => navigateToPage("register");
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
      return [...prev, ...newExercises];
    });

    try {
      const planString = localStorage.getItem("generatedPlan");
      if (planString) {
        const plan = JSON.parse(planString);
        const activeWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);

        if (activeWorkout) {
          const workoutIndex = plan.workoutDays.findIndex(
            (day: any) =>
              day.dayNumber === activeWorkout.dayNumber && day.dayName === activeWorkout.dayName
          );

          if (workoutIndex !== -1) {
            const existingExerciseIds = new Set(
              plan.workoutDays[workoutIndex].exercises.map((ex: any) => ex.id)
            );
            const newExercisesToAdd = exercises.filter((ex) => !existingExerciseIds.has(ex.id));

            if (newExercisesToAdd.length > 0) {
              plan.workoutDays[workoutIndex].exercises.push(...newExercisesToAdd);
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
    navigateToPage("workout");
  };
  const navigateToProgress = () => navigateToPage("progress");
  const navigateToHistory = () => navigateToPage("history");
  const navigateToAI = () => navigateToPage("ai");
  const navigateToAllExercise = () => {
    setAllExerciseReturnPage("workout");
    navigateToPage("allExercise");
  };
  const navigateToMyPlan = () => navigateToPage("myPlan");
  const navigateToAvailableEquipment = () => navigateToPage("availableEquipment");
  const navigateToSettings = () => navigateToPage("settings");
  const navigateToExerciseProgress = (exerciseId: number) => {
    setSelectedExerciseProgressId(exerciseId);
    navigateToPage("exerciseProgress");
  };
  const navigateToCreateProgram = () => {
    setCreateProgramDays([]);
    setCreateProgramName("");
    setEditingProgramId(undefined);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const handleSelectSavedProgram = (program: SavedProgram) => {
    const plan = {
      id: program.id,
      name: program.name,
      splitType: "CUSTOM",
      createdAt: program.createdAt,
      settings: loadPlanSettings(),
      workoutDays: program.days.map((day, i) => ({
        dayNumber: i + 1,
        dayName: day.name,
        muscleGroups: [...new Set(day.exercises.flatMap((ex) => ex.muscle_groups))],
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
    setCreateProgramDays(program.days);
    setCreateProgramName(program.name);
    setEditingProgramId(program.id);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const navigateToActiveWorkout = (options?: { resetCompleted?: boolean }) => {
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
    navigateToPage("exerciseDetails");
  };

  const navigateToExerciseSets = (
    exercise: Exercise,
    mode: "preWorkout" | "activeWorkout" = "preWorkout"
  ) => {
    setSelectedExercise(exercise);
    setExerciseSetsMode(mode);
    navigateToPage("exerciseSets");
  };

  const backFromExerciseDetails = () => {
    setSelectedExercise(null);
    navigateToPage("workout");
  };

  const backFromExerciseSets = () => {
    const previousMode = exerciseSetsMode;
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage(previousMode === "activeWorkout" ? "activeWorkout" : "workout");
    });
  };

  const markExerciseComplete = (exerciseId: number, sets: ExerciseSetRow[], painLevel: number | undefined) => {
    const completedSets = sets.filter((s) => s.completed).map((s) => ({ ...s }));
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
          <HomePage onNavigateToLogin={navigateToLogin} onNavigateToWorkout={navigateToWorkout} />
        );
      case "login":
        return (
          <Login
            onSwitchToRegister={navigateToRegister}
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
            onNavigateToAI={navigateToAI}
            onNavigateToSettings={navigateToSettings}
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
            onOpenExerciseSets={(ex) => navigateToExerciseSets(ex, "activeWorkout")}
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
            onNavigateToAI={navigateToAI}
            activePage="history"
            workouts={workoutHistory}
          />
        );
      case "ai":
        return (
          <AIPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
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
                    const existingIds = new Set(day.exercises.map((ex) => ex.id));
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
        return <SettingsPage onNavigateBack={navigateToProgress} />;
      default:
        return (
          <HomePage onNavigateToLogin={navigateToLogin} onNavigateToWorkout={navigateToWorkout} />
        );
    }
  };

  return (
    <>
      {isPagePending ? <PageLoader className="pointer-events-none" /> : null}
      <Suspense fallback={<PageLoader className="pointer-events-none" />}>{renderPage()}</Suspense>
    </>
  );
}

export default App;
