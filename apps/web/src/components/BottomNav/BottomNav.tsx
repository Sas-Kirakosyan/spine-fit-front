import type { SVGProps } from "react";
import { useTranslation } from "react-i18next";

type NavKey = "workout" | "progress" | "history" | "profile" | "ai";

interface BottomNavProps {
  activePage: NavKey;
  onWorkoutClick: () => void;
  onProgressClick: () => void;
  onHistoryClick: () => void;
  onProfileClick: () => void;
  onAIClick: () => void;
}

const iconBaseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function WorkoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M6 4v16M18 4v16M3 8v8M21 8v8M6 12h12" />
    </svg>
  );
}

function ProgressIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

// function AIIcon(props: SVGProps<SVGSVGElement>) {
//   return (
//     <svg {...iconBaseProps} {...props}>
//       <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
//       <path d="M19 14l.7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8L16.5 17l1.8-.7L19 14z" />
//     </svg>
//   );
// }

const navButtonClass = (isActive: boolean) =>
  [
    "flex flex-1 flex-col items-center justify-center gap-1",
    "min-h-[56px] py-2 px-1",
    "text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em]",
    "transition-colors",
    isActive
      ? "bg-main text-white"
      : "bg-[#1B1E2B] text-slate-200 hover:text-white",
  ].join(" ");

const iconClass = "h-5 w-5 md:h-6 md:w-6";

export function BottomNav({
  activePage,
  onWorkoutClick,
  onProgressClick,
  onHistoryClick,
  onProfileClick,
  // onAIClick,
}: BottomNavProps) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("bottomNav.workout")}
      className="bg-[#1B1E2B] flex justify-evenly w-full max-w-[440px] md:max-w-none"
    >
      <button
        type="button"
        aria-current={activePage === "workout" ? "page" : undefined}
        className={navButtonClass(activePage === "workout")}
        onClick={onWorkoutClick}
      >
        <WorkoutIcon className={iconClass} />
        <span>{t("bottomNav.workout")}</span>
      </button>
      <button
        type="button"
        aria-current={activePage === "progress" ? "page" : undefined}
        className={navButtonClass(activePage === "progress")}
        onClick={onProgressClick}
      >
        <ProgressIcon className={iconClass} />
        <span>{t("bottomNav.progress")}</span>
      </button>
      <button
        type="button"
        aria-current={activePage === "history" ? "page" : undefined}
        className={navButtonClass(activePage === "history")}
        onClick={onHistoryClick}
      >
        <HistoryIcon className={iconClass} />
        <span>{t("bottomNav.history")}</span>
      </button>
      <button
        type="button"
        aria-current={activePage === "profile" ? "page" : undefined}
        className={navButtonClass(activePage === "profile")}
        onClick={onProfileClick}
      >
        <ProfileIcon className={iconClass} />
        <span>{t("bottomNav.profile")}</span>
      </button>
      {/* <button                         // AI Assisstent zut anjataca navbaric
        type="button"
        aria-current={activePage === "ai" ? "page" : undefined}
        className={navButtonClass(activePage === "ai")}
        onClick={onAIClick}
      >
        <AIIcon className={iconClass} />
        <span>{t("bottomNav.ai")}</span>
      </button> */}
    </nav>
  );
}
