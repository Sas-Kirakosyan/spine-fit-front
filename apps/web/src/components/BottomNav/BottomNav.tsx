import { useTranslation } from "react-i18next";

interface BottomNavProps {
  activePage: "workout" | "progress" | "history" | "profile" | "ai";
  onWorkoutClick: () => void;
  onProgressClick: () => void;
  onHistoryClick: () => void;
  onProfileClick: () => void;
  onAIClick: () => void;
}

const baseNavButtonClass =
  "flex py-4 text-[10px] p-[8px] font-semibold uppercase tracking-[0.2em] ";

const getNavButtonClassName = (isActive: boolean) =>
  `${baseNavButtonClass} ${
    isActive
      ? "bg-main text-white"
      : "bg-[#1B1E2B] text-slate-200 hover:text-white"
  }`;

export function BottomNav({
  activePage,
  onWorkoutClick,
  onProgressClick,
  onHistoryClick,
  onProfileClick,
  onAIClick,
}: BottomNavProps) {
  const { t } = useTranslation();
  return (
    <nav className="bg-[#1B1E2B] flex justify-evenly w-full max-w-[440px]">
      <button
        type="button"
        className={getNavButtonClassName(activePage === "workout")}
        onClick={onWorkoutClick}
      >
        {t("bottomNav.workout")}
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "progress")}
        onClick={onProgressClick}
      >
        {t("bottomNav.progress")}
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "history")}
        onClick={onHistoryClick}
      >
        {t("bottomNav.history")}
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "profile")}
        onClick={onProfileClick}
      >
        {t("bottomNav.profile")}
      </button>
      <button
        type="button"
        className={getNavButtonClassName(activePage === "ai")}
        onClick={onAIClick}
      >
        {t("bottomNav.ai")}
      </button>
    </nav>
  );
}
