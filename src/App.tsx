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
import type { ExerciseSetRow, FinishedWorkoutSummary } from "@/types/workout";
import { HistoryPage } from "@/pages/HistoryPage/HistoryPage";
import { AllExercisePage } from "@/pages/AllExercisePage/AllExercisePage";
import { MyPlanPage } from "@/pages/MyPlanPage/MyPlanPage";
import { AvailableEquipmentPage } from "@/pages/MyPlanPage/AvailableEquipmentPage";
import exerciseData from "@/MockData/exercise.json";

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
      savedPage === "allExercise" ||
      savedPage === "myPlan" ||
      savedPage === "availableEquipment"
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
    } catch {}
    return [];
  });

  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(() => {
    const savedExercises = localStorage.getItem("workoutExercises");
    if (!savedExercises) {
      return (exerciseData as Exercise[]) || [];
    }
    try {
      const parsed = JSON.parse(savedExercises);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return (exerciseData as Exercise[]) || [];
  });

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("workoutHistory", JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    localStorage.setItem("workoutExercises", JSON.stringify(workoutExercises));
  }, [workoutExercises]);

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
  };

  const navigateToWorkout = () => {
    resetWorkoutState();
    setCurrentPage("workout");
  };
  const navigateToProfile = () => setCurrentPage("profile");
  const navigateToHistory = () => setCurrentPage("history");
  const navigateToAllExercise = () => setCurrentPage("allExercise");
  const navigateToMyPlan = () => setCurrentPage("myPlan");
  const navigateToAvailableEquipment = () =>
    setCurrentPage("availableEquipment");
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
            activePage="workout"
            onOpenExerciseDetails={navigateToExerciseDetails}
            onOpenExerciseSets={navigateToExerciseSets}
            onStartWorkoutSession={navigateToActiveWorkout}
            onNavigateToAllExercise={navigateToAllExercise}
            onNavigateToMyPlan={navigateToMyPlan}
            exercises={workoutExercises}
            onRemoveExercise={(exerciseId) => {
              setWorkoutExercises((prev) =>
                prev.filter((ex) => ex.id !== exerciseId)
              );
            }}
          />
        );
      case "profile":
        return (
          <ProfilePage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProfile={navigateToProfile}
            onNavigateToHistory={navigateToHistory}
            activePage="profile"
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
            onMarkExerciseComplete={markExerciseComplete}
            isDuringActiveWorkout={exerciseSetsMode === "activeWorkout"}
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
            exercises={workoutExercises}
          />
        );
      case "history":
        return (
          <HistoryPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProfile={navigateToProfile}
            onNavigateToHistory={navigateToHistory}
            activePage="history"
            workouts={workoutHistory}
          />
        );
      case "allExercise":
        return (
          <AllExercisePage
            onClose={navigateToWorkout}
            onAddExercises={handleAddExercises}
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
