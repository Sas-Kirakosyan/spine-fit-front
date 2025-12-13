interface QuizRadioOptionProps {
  option:
    | string
    | { value: string; label: string; image: string; description: string };
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function QuizRadioOption({
  option,
  index,
  isSelected,
  onSelect,
}: QuizRadioOptionProps) {
  const displayText = typeof option === "string" ? option : option.label;

  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full rounded-lg border-2 p-4 text-left transition ${
        isSelected
          ? "border-main bg-main/10 text-main"
          : "border-gray-200 hover:border-main/50 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full ${
            isSelected ? "bg-main" : "border-2 border-gray-300"
          }`}
        >
          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
        <span className="font-medium">{displayText}</span>
      </div>
    </button>
  );
}
