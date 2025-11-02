import { useState, useEffect } from "react";
import "./App.css";
import { HomePage } from "./components/HomePage/HomePage";
import { Registration } from "./components/RegistrationForm/Registration";
import { Login } from "./components/LoginForm/Login";
import { GeneralPage } from "./components/GeneralPage/GeneralPage";
import { WorkoutPage } from "./components/WorkoutPage/WorkoutPage";

type Page = "home" | "login" | "register" | "general" | "workout";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Восстанавливаем страницу из localStorage при инициализации
    const savedPage = localStorage.getItem("currentPage") as Page;
    return savedPage || "home";
  });

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");
  const navigateToGeneral = () => setCurrentPage("general");
  const navigateToWorkout = () => setCurrentPage("workout");

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToRegister={navigateToRegister}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "login":
        return (
          <Login
            onSwitchToRegister={navigateToRegister}
            onNavigateToHome={navigateToHome}
            onNavigateToGeneral={navigateToGeneral}
          />
        );
      case "register":
        return (
          <Registration
            onSwitchToLogin={navigateToLogin}
            onNavigateToHome={navigateToHome}
            onNavigateToGeneral={navigateToGeneral}
          />
        );
      case "general":
        return <GeneralPage onLogout={navigateToHome} />;
      case "workout":
        return <WorkoutPage onNavigateToHome={navigateToHome} />;
      default:
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToRegister={navigateToRegister}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
    }
  };

  return renderPage();
}

export default App;
