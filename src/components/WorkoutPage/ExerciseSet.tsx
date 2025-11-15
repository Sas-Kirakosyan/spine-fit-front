import React from "react";
import type { Exercise } from "../../types/exercise";
import { Input } from "../Input/Input";

type SetField = "reps" | "weight";

export interface ExerciseSetRow {
  reps: string;
  weight: string;
}

interface ExerciseSetProps {
  index: number;
  setEntry: ExerciseSetRow;
  exercise: Exercise;
  isActive: boolean;
  onValueChange: (index: number, field: SetField, value: string) => void;
}

export const ExerciseSet: React.FC<ExerciseSetProps> = ({
  index,
  setEntry,
  exercise,
  isActive,
  onValueChange,
}) => {
  return (
    <div key={`exercise-set-${index}`} className="flex gap-4">
      {/* Hexagonal Set Number */}
      <div className="flex justify-center w-10 flex-col items-center">
        <div
          className={`flex h-7 w-7 items-center justify-center border-[1px] text-[16px] font-semibold text-[#000000] ${
            isActive
              ? "border-[#000000] bg-[#ffffff]"
              : "border-[#A9A9A9] bg-[#A9A9A9]"
          }`}
          style={{
            clipPath:
              "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
          }}
        >
          {index + 1}
        </div>
      </div>
      <div
        className={`flex flex-1 flex-col gap-4 rounded-[22px] border px-4 py-3 shadow-inner ${
          isActive
            ? "border-white/40 bg-[#171C34]"
            : "border-white/6 bg-[#101326]/80"
        }`}
      >
        {isActive ? (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reps"
              value={setEntry.reps}
              type="number"
              onChange={(value) => onValueChange(index, "reps", value)}
              inputClassName="bg-[#101326]/80 border-white/40"
              wrapperClassName="max-w-[150px]"
            />
            <Input
              label="Weight"
              unit={exercise.weight_unit}
              value={setEntry.weight}
              type="number"
              onChange={(value) => onValueChange(index, "weight", value)}
              inputClassName="bg-[#101326]/80 border-white/40"
              wrapperClassName="max-w-[150px]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                Reps
              </span>
              <div className="flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-lg font-semibold text-white/35">
                {setEntry.reps || "—"}
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                Weight{" "}
                {exercise.weight_unit && (
                  <span className="text-[10px] uppercase text-slate-500">
                    ({exercise.weight_unit})
                  </span>
                )}
              </span>
              <div className="flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-lg font-semibold text-white/35">
                {setEntry.weight || "—"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
