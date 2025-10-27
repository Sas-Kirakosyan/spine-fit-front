import { useState } from "react";
import "./App.css";
import { HomePage } from "./components/HomePage/HomePage";
import { Registration } from "./components/RegistrationForm/Registration";
import { Login } from "./components/LoginForm/Login";

type Page = "home" | "login" | "register";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const navigateToHome = () => setCurrentPage("home");
  const navigateToLogin = () => setCurrentPage("login");
  const navigateToRegister = () => setCurrentPage("register");

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToRegister={navigateToRegister}
          />
        );
      case "login":
        return (
          <Login
            onSwitchToRegister={navigateToRegister}
            onNavigateToHome={navigateToHome}
          />
        );
      case "register":
        return (
          <Registration
            onSwitchToLogin={navigateToLogin}
            onNavigateToHome={navigateToHome}
          />
        );
      default:
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToRegister={navigateToRegister}
          />
        );
    }
  };

  return renderPage();
}

export default App;
