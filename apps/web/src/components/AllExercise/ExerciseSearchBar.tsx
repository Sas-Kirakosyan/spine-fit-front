import { useTranslation } from "react-i18next";

interface ExerciseSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ExerciseSearchBar({
  searchQuery,
  onSearchChange,
}: ExerciseSearchBarProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder={t("allExercisePage.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-[#1B1E2B] text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-main"
        autoFocus
      />
    </div>
  );
}

