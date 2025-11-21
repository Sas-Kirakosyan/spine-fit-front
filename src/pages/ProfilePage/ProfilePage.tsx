import { PageContainer } from "../../layout/PageContainer";
import type { ProfilePageProps } from "../../types/pages";

const baseNavButtonClass =
  "flex flex-1 flex-col items-center py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors";

const getNavButtonClassName = (isActive: boolean) =>
  `${baseNavButtonClass} ${
    isActive
      ? "bg-blue-600 text-white"
      : "bg-[#1B1E2B] text-slate-200 hover:text-white"
  }`;

export function ProfilePage({
  onNavigateToWorkout,
  onNavigateToProfile,
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

      <nav className="bg-[#1B1E2B] flex justify-evenly gap-4 rounded-[10px]">
        <button
          type="button"
          className={getNavButtonClassName(activePage === "workout")}
          onClick={onNavigateToWorkout}
        >
          Workout
        </button>
        <button
          type="button"
          className={getNavButtonClassName(activePage === "profile")}
          onClick={onNavigateToProfile}
        >
          Profile
        </button>
      </nav>
    </PageContainer>
  );
}
