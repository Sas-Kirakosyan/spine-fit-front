import { useState } from "react";
import { QuizModal } from "@/pages/QuizPage/QuizModal";
import { PageContainer } from "@/layout/PageContainer";
import { Logo } from "@/components/Logo/Logo";
import type { HomePageProps } from "@/types/pages";

export function HomePage({
  onNavigateToLogin,
  onNavigateToWorkout,
}: HomePageProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState<"home" | "gym">("home");

  const handleStartQuiz = () => {
    setWorkoutType("home");
    setIsQuizOpen(true);
  };

  const handleCloseQuiz = () => {
    setIsQuizOpen(false);
  };

  return (
    <>
      <PageContainer
        backgroundImage="url('https://ignitefitness.com/wp-content/uploads/2024/06/Gym-Equipment.jpg')"
        overlayClassName="bg-black/30"
      >
        <div className="flex justify-start">
          <Logo size="lg" />
        </div>

        <div className="mt-auto">
          <h2 className="text-white text-4xl font-semibold leading-tight">
            Train safe
            <br />
            Without back pain
          </h2>
        </div>

        <div className="mt-10 space-y-6">
          <button
            onClick={handleStartQuiz}
            className="w-full rounded-[18px] bg-[#0000E7] py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/40 transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            START
          </button>

          <button
            onClick={onNavigateToLogin}
            className="w-full text-center text-md font-medium text-white hover:text-white/50"
          >
            Log In
          </button>
        </div>
      </PageContainer>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={handleCloseQuiz}
        workoutType={workoutType}
        onQuizComplete={onNavigateToWorkout}
      />
    </>
  );
}
