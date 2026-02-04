import { useState, useMemo } from "react";
import type { ExerciseProgress } from "@/utils/progressStats";
import { ExerciseItem } from "@/components/Progress/ExerciseItem";

interface ExerciseListProps {
  exercises: ExerciseProgress[];
}

type SortOption = "recent" | "name" | "1rm";

export function ExerciseList({ exercises }: ExerciseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const filteredAndSorted = useMemo(() => {
    let filtered = exercises;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = exercises.filter((ex) =>
        ex.exerciseName.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.lastPerformed).getTime() -
            new Date(a.lastPerformed).getTime()
          );
        case "name":
          return a.exerciseName.localeCompare(b.exerciseName);
        case "1rm":
          return b.estimated1RM - a.estimated1RM;
        default:
          return 0;
      }
    });

    return sorted;
  }, [exercises, searchQuery, sortBy]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search for exercise"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-[#1B1E2B]/80 border border-white/10 px-10 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
        />
      </div>

      {/* Sort option */}
      <button
        type="button"
        onClick={() => {
          const options: SortOption[] = ["recent", "name", "1rm"];
          const currentIndex = options.indexOf(sortBy);
          const nextIndex = (currentIndex + 1) % options.length;
          setSortBy(options[nextIndex]);
        }}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
        <span>
          {sortBy === "recent"
            ? "Recent Performed"
            : sortBy === "name"
              ? "Name (A-Z)"
              : "1RM (High to Low)"}
        </span>
      </button>

      {/* Exercise list */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
          <p className="text-sm text-slate-400">
            {searchQuery
              ? "No exercises found matching your search"
              : "No exercises performed yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredAndSorted.map((exercise) => (
            <ExerciseItem key={exercise.exerciseId} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}
