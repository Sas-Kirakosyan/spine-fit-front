interface QuizSliderProps {
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}

export function QuizSlider({ value, min, max, onChange }: QuizSliderProps) {
  const numValue = value ? parseFloat(value) : min;

  // Calculate color based on value (green to red gradient)
  const getColor = (val: number) => {
    const percent = (val - min) / (max - min);
    if (percent <= 0.3) {
      return "#10b981"; // green-500
    } else if (percent <= 0.5) {
      return "#84cc16"; // lime-500
    } else if (percent <= 0.7) {
      return "#eab308"; // yellow-500
    } else if (percent <= 0.85) {
      return "#f97316"; // orange-500
    } else {
      return "#ef4444"; // red-500
    }
  };

  const currentColor = getColor(numValue);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">No pain</span>
        <div className="text-3xl font-bold" style={{ color: currentColor }}>
          {value || min}
        </div>
        <span className="text-sm text-gray-500">Worst pain</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value || min}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #84cc16 30%, #eab308 50%, #f97316 70%, #ef4444 100%)`,
          }}
        />

        {/* Number markers */}
        <div className="flex justify-between mt-2 px-1">
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
            (num) => {
              const numColor = getColor(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num.toString())}
                  className={`text-xs w-6 h-6 rounded-full transition ${
                    numValue === num
                      ? "text-white font-semibold"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  style={
                    numValue === num
                      ? { backgroundColor: numColor }
                      : undefined
                  }
                >
                  {num}
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
