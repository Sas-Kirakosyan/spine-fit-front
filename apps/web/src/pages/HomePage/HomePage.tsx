import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuizModal } from "@/components/Quiz/QuizModal";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import { LanguageSelector } from "@/components/LanguageSelector/LanguageSelector";
import type { HomePageProps } from "@/types/pages";
import { trackEvent } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";

interface HomePageExtraProps {
  autoOpenQuiz?: boolean;
  oauthError?: string | null;
}

function HomePage({
  onNavigateToLogin,
  onNavigateToGeneratingPlan,
  autoOpenQuiz,
  oauthError,
}: HomePageProps & HomePageExtraProps) {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const isAuthenticated = auth.status === "authenticated";
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Open the quiz automatically when App.tsx signals a fresh OAuth sign-up
  // without a plan yet. Effect (not initial state) so we don't miss the prop
  // flipping true after HomePage has already mounted.
  useEffect(() => {
    if (autoOpenQuiz) setIsQuizOpen(true);
  }, [autoOpenQuiz]);

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
        backgroundImage={`url('/exercisesSm/home-page.webp')`}
        backgroundPositionClassName="bg-center md:bg-right"
        overlayClassName="bg-black/30"
      >
        <div className="flex items-center justify-between">
          <Logo text={t("homePage.logoText")} />
          <div className="mr-4 mt-4">
            <LanguageSelector />
          </div>
        </div>

        <div className="mt-auto md:mt-0 md:flex md:flex-1 md:items-center">
          <div className="w-full md:max-w-[600px] lg:max-w-[640px] md:px-12 md:py-16 lg:px-20">
            <div className="px-4 py-4 md:px-0 md:py-0">
              <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
                {t("homePage.heading1")}
                <br />
                {t("homePage.heading2")}
              </h2>
              <p className="text-white/80 text-sm md:text-lg lg:text-xl mt-2 md:mt-5 max-w-[480px]">
                {t("homePage.subheading")}
              </p>
            </div>

            <div className="flex flex-col items-stretch md:items-start mt-10 md:mt-10 space-y-4 md:space-y-5 px-4 md:px-0">
              {oauthError && (
                <p
                  role="alert"
                  className="w-full max-w-[370px] md:max-w-[360px] rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-center text-sm text-white"
                >
                  {oauthError}
                </p>
              )}

              <button
                onClick={handleStartQuiz}
                className="w-full max-w-[370px] md:max-w-[280px] rounded-[18px] bg-main py-4 md:py-5 text-lg md:text-base font-semibold uppercase tracking-[0.08em] text-white min-h-[56px] shadow-lg shadow-main/30 transition hover:brightness-110"
              >
                {t("homePage.startProgram")}
              </button>

              {!isAuthenticated && (
                <button
                  onClick={onNavigateToLogin}
                  className="w-full md:w-auto py-2 pb-15 md:pb-2 text-center md:text-left text-lg font-medium text-white/90 hover:text-white transition"
                >
                  {t("homePage.logIn")}
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={handleCloseQuiz}
        onQuizComplete={onNavigateToGeneratingPlan}
        onNavigateToLogin={onNavigateToLogin}
      />
    </>
  );
}

export default HomePage;
