import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuizModal } from "@/components/Quiz/QuizModal";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import { LanguageSelector } from "@/components/LanguageSelector/LanguageSelector";
import type { HomePageProps } from "@/types/pages";
import { trackEvent } from "@/utils/analytics";
import { assetUrl } from "@/lib/assets";
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
        backgroundImage={`url('${assetUrl("Photo/Exercises/cable-knee-drive.webp")}')`}
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
          <p className="text-white/70 text-sm mt-2">
            {t("homePage.subheading")}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center mt-10 space-y-6 px-4">
          {oauthError && (
            <p
              role="alert"
              className="w-full max-w-[370px] rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-center text-sm text-white"
            >
              {oauthError}
            </p>
          )}

          <button
            onClick={handleStartQuiz}
            className="w-full max-w-[370px] rounded-[18px] bg-main py-4 text-lg font-semibold text-white"
          >
            {t("homePage.startProgram")}
          </button>

          {!isAuthenticated && (
            <button
              onClick={onNavigateToLogin}
              className="w-full py-2 pb-15 text-center text-lg font-medium text-white hover:text-white/50"
            >
              {t("homePage.logIn")}
            </button>
          )}
        </div>
      </PageContainer>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={handleCloseQuiz}
        onQuizComplete={onNavigateToGeneratingPlan}
      />
    </>
  );
}

export default HomePage;
