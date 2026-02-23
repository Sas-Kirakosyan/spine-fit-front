import { useState, useEffect } from "react";
import { HomePage } from "@/pages/HomePage/HomePage";
import { Registration } from "@/pages/RegistrationPage/Registration";
import { Login } from "@/pages/LoginPage/Login";
import { WorkoutPage } from "@/pages/WorkoutPage/WorkoutPage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import { ExerciseSetsPage } from "@/pages/WorkoutPage/ExerciseSetsPage";
import { ExerciseDetails } from "@/pages/WorkoutPage/ExerciseHowTo";
import { ActiveWorkoutPage } from "@/pages/WorkoutPage/ActiveWorkoutPage";
import type { Exercise } from "@/types/exercise";
import type { Page } from "@/types/navigation";
import type { ExerciseSetRow, FinishedWorkoutSummary, SavedProgram, TrainingDay } from "@/types/workout";
import { HistoryPage } from "@/pages/HistoryPage/HistoryPage";
import { AllExercisePage } from "@/pages/AllExercisePage/AllExercisePage";
import { MyPlanPage } from "@/pages/MyPlanPage/MyPlanPage";
import { AvailableEquipmentPage } from "@/pages/MyPlanPage/AvailableEquipmentPage";
import { AIPage } from "@/pages/AIPage/AIPage";
import { SettingsPage } from "@/pages/SettingsPage/SettingsPage";
import { CreateProgramPage } from "@/pages/CreateWorkoutPage/CreateWorkoutPage";
import { loadPlanSettings } from "@/types/planSettings";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import "@/utils/testWorkoutHistoryGenerator";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem("currentPage") as Page | null;
    if (
      savedPage === "home" ||
      savedPage === "login" ||
      savedPage === "register" ||
      savedPage === "workout" ||
      savedPage === "profile" ||
      savedPage === "exerciseSets" ||
      savedPage === "exerciseDetails" ||
      savedPage === "activeWorkout" ||
      savedPage === "history" ||
      savedPage === "ai" ||
      savedPage === "allExercise" ||
      savedPage === "myPlan" ||
      savedPage === "availableEquipment" ||
      savedPage === "settings" ||
      savedPage === "createProgram"
    ) {
      return savedPage;
    }
    return "home";
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
  const [workoutHistory, setWorkoutHistory] = useState<
    FinishedWorkoutSummary[]
  >(() => {
    const savedHistory = localStorage.getItem("workoutHistory");
    if (!savedHistory) {
      return [];
    }
    try {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
    return [];
  });

  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(() => {
    const savedExercises = localStorage.getItem("workoutExercises");
    if (!savedExercises) {
      return [];
    }
    try {
      const parsed = JSON.parse(savedExercises);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      console.error("Error parsing saved workout exercises");
    }
    return [];
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
  const [editingProgramId, setEditingProgramId] = useState<string | undefined>();

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
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

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");
  const resetWorkoutState = () => {
    setCompletedExerciseIds([]);
    setExerciseLogs({});
    setWorkoutStartTime(null);
  };

  const handleAddExercises = (exercises: Exercise[]) => {
    setWorkoutExercises((prev) => {
      const existingIds = new Set(prev.map((ex) => ex.id));
      const newExercises = exercises.filter((ex) => !existingIds.has(ex.id));
      return [...prev, ...newExercises];
    });

    // Also update the generated plan in localStorage for the current active workout
    try {
      const planString = localStorage.getItem("generatedPlan");
      if (planString) {
        const plan = JSON.parse(planString);

        // Find the current active workout (next uncompleted workout)
        const activeWorkout = getNextAvailableWorkout(
          plan,
          completedWorkoutIds
        );

        if (activeWorkout) {
          // Find the index of this workout in the plan
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
              console.log(
                `✅ Added ${newExercisesToAdd.length} exercises to ${activeWorkout.dayName} workout:`,
                newExercisesToAdd.map((ex) => ex.name)
              );
            }
          }
        } else {
          console.warn(
            "⚠️ No active workout found (all workouts may be completed)"
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Error updating generated plan with new exercises:",
        error
      );
    }
  };

  const navigateToWorkout = () => {
    resetWorkoutState();
    setIsCustomWorkoutMode(false);
    setCurrentPage("workout");
  };
  const navigateToProfile = () => setCurrentPage("profile");
  const navigateToHistory = () => setCurrentPage("history");
  const navigateToAI = () => setCurrentPage("ai");
  const navigateToAllExercise = () => {
    setAllExerciseReturnPage("workout");
    setCurrentPage("allExercise");
  };
  const navigateToMyPlan = () => setCurrentPage("myPlan");
  const navigateToAvailableEquipment = () =>
    setCurrentPage("availableEquipment");
  const navigateToSettings = () => setCurrentPage("settings");
  const navigateToCreateProgram = () => {
    setCreateProgramDays([]);
    setCreateProgramName("");
    setEditingProgramId(undefined);
    setActiveDayId(null);
    setCurrentPage("createProgram");
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
    setCurrentPage("workout");
  };

  const handleEditSavedProgram = (program: SavedProgram) => {
    setCreateProgramDays(program.days);
    setCreateProgramName(program.name);
    setEditingProgramId(program.id);
    setActiveDayId(null);
    setCurrentPage("createProgram");
  };
  const navigateToActiveWorkout = (options?: { resetCompleted?: boolean }) => {
    if (options?.resetCompleted !== false) {
      setCompletedExerciseIds([]);
      setExerciseLogs({});
    }
    if (workoutStartTime === null) {
      setWorkoutStartTime(Date.now());
    }
    setSelectedExercise(null);
    setExerciseSetsMode("preWorkout");
    setCurrentPage("activeWorkout");
  };
  const navigateToExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentPage("exerciseDetails");
  };
  const navigateToExerciseSets = (
    exercise: Exercise,
    mode: "preWorkout" | "activeWorkout" = "preWorkout"
  ) => {
    setSelectedExercise(exercise);
    setExerciseSetsMode(mode);
    setCurrentPage("exerciseSets");
  };
  const backFromExerciseDetails = () => {
    setSelectedExercise(null);
    setCurrentPage("workout");
  };
  const backFromExerciseSets = () => {
    const previousMode = exerciseSetsMode;
    setSelectedExercise(null);
    setExerciseSetsMode("preWorkout");
    if (previousMode === "activeWorkout") {
      setCurrentPage("activeWorkout");
    } else {
      setCurrentPage("workout");
    }
  };

  const markExerciseComplete = (exerciseId: number, sets: ExerciseSetRow[]) => {
    const completedSets = sets
      .filter((setEntry) => setEntry.completed)
      .map((setEntry) => ({ ...setEntry }));
    setExerciseLogs((prev) => ({
      ...prev,
      [exerciseId]: completedSets,
    }));
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    navigateToActiveWorkout({ resetCompleted: false });
  };

  const handleFinishWorkout = (summary?: FinishedWorkoutSummary) => {
    if (summary) {
      setWorkoutHistory((prev) => [...prev, summary]);
      resetWorkoutState();
      setCurrentPage("history");
      return;
    }
    resetWorkoutState();
    setCurrentPage("workout");
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
            onNavigateToProfile={navigateToProfile}
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
            onRemoveExercise={(exerciseId) => {
              setWorkoutExercises((prev) =>
                prev.filter((ex) => ex.id !== exerciseId)
              );
            }}
            completedWorkoutIds={completedWorkoutIds}
          />
        );
      case "profile":
        return (
          <ProfilePage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProfile={navigateToProfile}
            onNavigateToHistory={navigateToHistory}
            onNavigateToAI={navigateToAI}
            onNavigateToSettings={navigateToSettings}
            activePage="profile"
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
            onOpenExerciseSets={(exercise) =>
              navigateToExerciseSets(exercise, "activeWorkout")
            }
            onFinishWorkout={handleFinishWorkout}
            completedExerciseIds={completedExerciseIds}
            workoutStartTime={workoutStartTime || undefined}
            exerciseLogs={exerciseLogs}
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
            onNavigateToProfile={navigateToProfile}
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
            onNavigateToProfile={navigateToProfile}
            onNavigateToHistory={navigateToHistory}
            onNavigateToAI={navigateToAI}
            activePage="ai"
          />
        );
      case "allExercise":
        return (
          <AllExercisePage
            onClose={() => {
              if (allExerciseReturnPage === "createProgram") {
                setCurrentPage("createProgram");
              } else {
                navigateToWorkout();
              }
            }}
            onAddExercises={(exercises) => {
              if (allExerciseReturnPage === "createProgram" && activeDayId) {
                setCreateProgramDays((prev) =>
                  prev.map((day) => {
                    if (day.id !== activeDayId) return day;
                    const existingIds = new Set(day.exercises.map((ex) => ex.id));
                    const newExercises = exercises.filter(
                      (ex) => !existingIds.has(ex.id),
                    );
                    return { ...day, exercises: [...day.exercises, ...newExercises] };
                  }),
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
              setCurrentPage("allExercise");
            }}
            onSave={() => {
              navigateToWorkout();
            }}
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

  return renderPage();
}

export default App;
