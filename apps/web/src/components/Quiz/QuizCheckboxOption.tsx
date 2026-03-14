interface QuizCheckboxOptionProps {
  option:
    | string
    | { value: string; label: string; image: string; description: string };
  index: number;
  isSelected: boolean;
  onToggle: (index: number) => void;
}

export function QuizCheckboxOption({
  option,
  index,
  isSelected,
  onToggle,
}: QuizCheckboxOptionProps) {
  const displayText = typeof option === "string" ? option : option.label;

  return (
    <button
      onClick={() => onToggle(index)}
      className={`w-full rounded-lg border-2 p-4 text-left transition ${
        isSelected
          ? "border-main bg-main/10 text-main"
          : "border-gray-200 hover:border-main/50 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`mr-3 flex h-5 w-5 items-center justify-center rounded ${
            isSelected ? "bg-main" : "border-2 border-gray-300"
          }`}
        >
          {isSelected && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span className="font-medium">{displayText}</span>
      </div>
    </button>
  );
}
