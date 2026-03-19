import { LazyImage } from "@/components/ui/LazyImage";

interface QuizImageRadioOptionProps {
  option: { value: string; label: string; image: string; description: string };
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function QuizImageRadioOption({
  option,
  index,
  isSelected,
  onSelect,
}: QuizImageRadioOptionProps) {
  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full rounded-lg border-2 p-4 text-left transition ${
        isSelected
          ? "border-main bg-main/10"
          : "border-gray-200 hover:border-main/50 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-4">
        {option.image && (
          <div className="flex-shrink-0 bg-gray-100 rounded-lg p-3">
            <LazyImage
              src={option.image}
              alt={option.label}
              className="h-28 w-28 object-contain"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">{option.label}</span>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 ${
                isSelected ? "bg-main" : "border-2 border-gray-300"
              }`}
            >
              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </div>
          {option.description && (
            <p className="mt-1 text-sm text-gray-600">{option.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
