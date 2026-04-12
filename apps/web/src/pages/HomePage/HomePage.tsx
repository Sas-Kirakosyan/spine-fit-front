import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QuizModal } from "@/components/Quiz/QuizModal";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import { LanguageSelector } from "@/components/LanguageSelector/LanguageSelector";
import type { HomePageProps } from "@/types/pages";
import { trackEvent } from "@/utils/analytics";

function HomePage({ onNavigateToLogin, onNavigateToWorkout }: HomePageProps) {
  const { t, i18n } = useTranslation();
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const handleStartQuiz = () => {
    trackEvent("onboarding_started", {
      entry_point: "home_start_button",
      language: i18n.language,
    });
    setIsQuizOpen(true);
  };

  const handleCloseQuiz = () => {
    setIsQuizOpen(false);
  };

  return (
    <>
      <PageContainer
        backgroundImage="url('https://aestheticxfitness.com/wp-content/uploads/slider/cache/b0321dd7df42008a1983d29db8732f10/WEQD.jpg')"
        overlayClassName="bg-black/30"
      >
        <div className="flex items-center justify-between">
          <Logo text={t("homePage.logoText")} />
          <div className="mr-4 mt-4">
            <LanguageSelector />
          </div>
        </div>
        <div className="mt-auto px-4 py-4">
          <h2 className="text-white text-4xl font-semibold leading-tight">
            {t("homePage.heading1")}
            <br />
            {t("homePage.heading2")}
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center mt-10 space-y-6 px-4">
          <button
            onClick={handleStartQuiz}
            className="w-full max-w-[370px] rounded-[18px] bg-main py-4 text-lg font-semibold text-white"
          >
            {t("homePage.startProgram")}
          </button>

          <button
            onClick={onNavigateToLogin}
            className="w-full py-2 text-center text-md font-medium text-white hover:text-white/50"
          >
            {t("homePage.logIn")}
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

export default HomePage;
