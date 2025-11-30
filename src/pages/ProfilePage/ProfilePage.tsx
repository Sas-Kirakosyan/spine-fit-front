import { PageContainer } from "@/layout/PageContainer";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import type { ProfilePageProps } from "@/types/pages";

export function ProfilePage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  activePage,
}: ProfilePageProps) {
  return (
    <PageContainer contentClassName="gap-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[32px] font-semibold uppercase tracking-[0.4em] text-white">
            SpineFit
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Profile</h1>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-5 rounded-[14px] bg-[#1B1E2B]/80 p-6 text-slate-100 shadow-xl ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold">Ваш профиль</h2>
        <p className="text-sm text-slate-300">
          Здесь в дальнейшем появится информация о вашем прогрессе, статистика
          тренировок и персональные рекомендации.
        </p>
      </section>

      <BottomNav
        activePage={activePage}
        onWorkoutClick={onNavigateToWorkout}
        onProfileClick={onNavigateToProfile}
        onHistoryClick={onNavigateToHistory}
      />
    </PageContainer>
  );
}
