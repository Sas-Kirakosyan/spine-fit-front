interface QuizInputWithUnitProps {
  value: string;
  unit: string;
  unitOptions: string[];
  placeholder: string;
  inputType?: "number" | "text";
  onChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
}

export function QuizInputWithUnit({
  value,
  unit,
  unitOptions,
  placeholder,
  inputType = "text",
  onChange,
  onUnitChange,
}: QuizInputWithUnitProps) {
  return (
    <div className="flex gap-3 w-full min-w-0">
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-main focus:outline-none transition"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value)}
        className="rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-lg focus:border-main focus:outline-none transition flex-shrink-0"
        style={{ minWidth: "80px" }}
      >
        {unitOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
