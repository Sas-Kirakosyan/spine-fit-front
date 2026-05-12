import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface QuizYearSelectProps {
  value: string;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}

export function QuizYearSelect({
  value,
  min,
  max,
  onChange,
}: QuizYearSelectProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const maxYear = max ?? currentYear - 18;
  const minYear = min ?? 1930;

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const placeholder = t("quiz.input.selectYear", {
    defaultValue: "Select year",
  });
  const isEmpty = value === "" || value === undefined || value === null;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-4 py-3 pr-12 text-lg focus:border-main focus:outline-none transition cursor-pointer ${
          isEmpty ? "text-gray-400" : "text-gray-900"
        }`}
      >
        <span className="truncate">{isEmpty ? placeholder : value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-[50vh] overflow-y-auto rounded-lg border-2 border-gray-200 bg-white py-1 shadow-lg md:max-h-[28rem] lg:max-h-[32rem]"
        >
          {years.map((year) => {
            const yearStr = String(year);
            const isSelected = yearStr === value;
            return (
              <li
                key={year}
                role="option"
                aria-selected={isSelected}
                ref={isSelected ? selectedRef : undefined}
                onClick={() => {
                  onChange(yearStr);
                  setOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-lg transition ${
                  isSelected
                    ? "bg-main/10 font-semibold text-main"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                {year}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
