import { useState } from "react";
import { QuizModal } from "@/components/Quiz/QuizModal";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import type { HomePageProps } from "@/types/pages";

export function HomePage({
  onNavigateToLogin,
  onNavigateToWorkout,
}: HomePageProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const handleStartQuiz = () => {
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
        <Logo text="Traning app" />
        <div className="mt-auto px-4 py-4">
          <h2 className="text-white text-4xl font-semibold leading-tight">
            Strength instead
            <br />
            Of pain
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center mt-10 space-y-6 px-4">
          <button
            onClick={handleStartQuiz}
            className="w-full max-w-[370px] rounded-[18px] bg-main py-4 text-lg font-semibold text-white"
          >
            START PROGRAM
          </button>

          <button
            onClick={onNavigateToLogin}
            className="w-full py-2 text-center text-md font-medium text-white hover:text-white/50"
          >
            Log In
          </button>
        </div>
      </PageContainer>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={handleCloseQuiz}
        onQuizComplete={onNavigateToWorkout}
      />
    </>
  );
}
