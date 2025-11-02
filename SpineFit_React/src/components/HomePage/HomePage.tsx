import { useState } from "react";
import { QuizModal } from "../QuizModal/QuizModal";
import muscleIcon from "../../assets/muscle.png";

interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export function HomePage({
  onNavigateToLogin,
  onNavigateToRegister,
}: HomePageProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState<"home" | "gym">("home");

  const handleOpenQuiz = (type: "home" | "gym") => {
    setWorkoutType(type);
    setIsQuizOpen(true);
  };

  const handleCloseQuiz = () => {
    setIsQuizOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src={muscleIcon}
                alt="SpineFit Logo"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold text-blue-700">SpineFit</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToLogin}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Login
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Registration
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Choose your workout type
          </h2>
          <p className="text-lg text-gray-600">
            Take the quiz to get a personalized workout plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div
            onClick={() => handleOpenQuiz("home")}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
          >
            <div className="h-64 bg-gradient-to-br from-green-400 to-emerald-600 relative">
              <div className="absolute inset-0 bg-blue-600 bg-opacity-10 group-hover:bg-opacity-20 transition-opacity"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-3xl font-bold">Home Workout</h3>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Home workouts without special equipment. Ideal for beginners and
                those who prefer to exercise in a comfortable environment.
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Let’s personalize your plan
                <svg
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleOpenQuiz("gym")}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
          >
            <div className="h-64 bg-gradient-to-br from-purple-400 to-pink-600 relative">
              <div className="absolute inset-0 bg-blue-600 bg-opacity-10 group-hover:bg-opacity-20 transition-opacity"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-3xl font-bold">Gym Workout</h3>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Gym workouts using professional equipment. For those who want to
                achieve maximum results.
              </p>
              <div className="flex items-center text-blue-600 font-semibold">
                Let’s personalize your plan
                <svg
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={handleCloseQuiz}
        workoutType={workoutType}
      />
    </div>
  );
}
