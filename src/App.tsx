import { useState, useEffect } from "react";
import { HomePage } from "./pages/HomePage/HomePage";
import { Registration } from "./pages/RegistrationPage/Registration";
import { Login } from "./pages/LoginPage/Login";
import { WorkoutPage } from "./pages/WorkoutPage/WorkoutPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { ExerciseSetsPage } from "./pages/WorkoutPage/ExerciseSetsPage";
import { ExerciseDetails } from "./pages/WorkoutPage/ExerciseHowTo";
import { ActiveWorkoutPage } from "./pages/WorkoutPage/ActiveWorkoutPage";
import type { Exercise } from "./types/exercise";
import type { Page } from "./types/navigation";
import type { ExerciseSetRow, FinishedWorkoutSummary } from "./types/workout";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";

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
      savedPage === "history"
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
      // ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("workoutHistory", JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");
  const resetWorkoutState = () => {
    setCompletedExerciseIds([]);
    setExerciseLogs({});
    setWorkoutStartTime(null);
  };

  const navigateToWorkout = () => {
    resetWorkoutState();
    setCurrentPage("workout");
  };
  const navigateToProfile = () => setCurrentPage("profile");
  const navigateToHistory = () => setCurrentPage("history");
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
