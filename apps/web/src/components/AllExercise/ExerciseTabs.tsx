import { useTranslation } from "react-i18next";

export type TabType = "all" | "muscle" | "categories";

interface ExerciseTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ExerciseTabs({ activeTab, onTabChange }: ExerciseTabsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-6 mb-4 border-b border-white/10">
      <button
        onClick={() => onTabChange("all")}
        className={`pb-2 px-1 text-sm font-medium transition-colors ${
          activeTab === "all"
            ? "text-white border-b-2 border-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {t("allExercisePage.tabs.all")}
      </button>
      <button
        onClick={() => onTabChange("muscle")}
        className={`pb-2 px-1 text-sm font-medium transition-colors ${
          activeTab === "muscle"
            ? "text-white border-b-2 border-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {t("allExercisePage.tabs.muscle")}
      </button>
      <button
        onClick={() => onTabChange("categories")}
        className={`pb-2 px-1 text-sm font-medium transition-colors ${
          activeTab === "categories"
            ? "text-white border-b-2 border-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {t("allExercisePage.tabs.categories")}
      </button>
    </div>
  );
}

