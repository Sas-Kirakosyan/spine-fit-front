import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import type { ProfilePageProps } from "@/types/pages";
import { SettingsIcon } from "@/components/Icons/Icons";
import { Button } from "@/components/Buttons/Button";

export function ProfilePage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToSettings,
  activePage,
}: ProfilePageProps) {
  return (
    <PageContainer contentClassName="gap-8">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <h1 className="mt-3 mx-2.5  text-3xl font-semibold text-white">Profile</h1>
        </div>
        <Button
          onClick={onNavigateToSettings}
          className="flex items-center gap-2 rounded-[14px] bg-white/10 mx-4 my-5"
        >
          <SettingsIcon />
        </Button>
      </header>

      <section className="flex flex-1 flex-col gap-5 rounded-[14px] bg-[#1B1E2B]/80 p-6 text-slate-100 shadow-xl ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold">Ваш профиль</h2>
        <p className="text-sm text-slate-300">
          Здесь в дальнейшем появится информация о вашем прогрессе, статистика
          тренировок и персональные рекомендации
        </p>
      </section>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
        />
      </div>
    </PageContainer>
  );
}
