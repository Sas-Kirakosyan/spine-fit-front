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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem("currentPage");
    if (
      savedPage === "home" ||
      savedPage === "login" ||
      savedPage === "register" ||
      savedPage === "workout" ||
      savedPage === "profile" ||
      savedPage === "exerciseSets" ||
      savedPage === "exerciseDetails" ||
      savedPage === "activeWorkout"
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

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");
  const navigateToWorkout = () => {
    setCompletedExerciseIds([]);
    setCurrentPage("workout");
  };
  const navigateToProfile = () => setCurrentPage("profile");
  const navigateToActiveWorkout = (options?: { resetCompleted?: boolean }) => {
    if (options?.resetCompleted !== false) {
      setCompletedExerciseIds([]);
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
    setSelectedExercise(null);
    setExerciseSetsMode("preWorkout");
    setCurrentPage("workout");
  };

  const markExerciseComplete = (exerciseId: number) => {
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    navigateToActiveWorkout({ resetCompleted: false });
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
            onFinishWorkout={navigateToWorkout}
            completedExerciseIds={completedExerciseIds}
          />
        );
      default:
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            // onNavigateToRegister={navigateToRegister}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
    }
  };

  return renderPage();
}

export default App;
