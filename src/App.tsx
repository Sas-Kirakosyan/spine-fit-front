import { useState, useEffect } from "react";
import "./App.css";
import { HomePage } from "./components/HomePage/HomePage";
import { Registration } from "./components/RegistrationForm/Registration";
import { Login } from "./components/LoginForm/Login";
import { WorkoutPage } from "./components/WorkoutPage/WorkoutPage";
import { ProfilePage } from "./components/ProfilePage/ProfilePage";
import { ExerciseSetsPage } from "./components/WorkoutPage/ExerciseSetsPage";
import { ExerciseDetails } from "./components/WorkoutPage/ExerciseDetails";
import type { Exercise } from "./types/exercise";

type Page =
  | "home"
  | "login"
  | "register"
  | "workout"
  | "profile"
  | "exerciseSets"
  | "exerciseDetails";

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
      savedPage === "exerciseDetails"
    ) {
      return savedPage;
    }
    return "home";
  });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");
  const navigateToWorkout = () => setCurrentPage("workout");
  const navigateToProfile = () => setCurrentPage("profile");
  const navigateToExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentPage("exerciseDetails");
  };
  const navigateToExerciseSets = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentPage("exerciseSets");
  };
  const backFromExerciseDetails = () => {
    setSelectedExercise(null);
    setCurrentPage("workout");
  };
  const backFromExerciseSets = () => {
    setSelectedExercise(null);
    setCurrentPage("workout");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            // onNavigateToRegister={navigateToRegister}
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
