interface SelectionRadioOptionProps {
  option: string;
  description?: string;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function SelectionRadioOption({
  option,
  description,
  index,
  isSelected,
  onSelect,
}: SelectionRadioOptionProps) {
  return (
    <div
      onClick={() => onSelect(index)}
      className={`w-full rounded-lg border-2 p-4 text-left transition cursor-pointer ${
        isSelected
          ? "border-main bg-main/10 text-white"
          : "border-gray-200 hover:border-main/50 "
      }`}
    >
      <div className="flex items-center">
        <div
          className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            isSelected ? "bg-main" : "border-2 border-gray-300"
          }`}
        >
          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-white">{option}</span>
          {description && (
            <span className="mt-1 text-sm text-white/70">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
