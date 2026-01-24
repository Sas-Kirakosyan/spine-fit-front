import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Buttons/Button";
import { ChevronLeftIcon, ChevronDownIcon } from "@/components/Icons/Icons";

interface BodyProfileData {
  gender: string;
  dateOfBirth: string;
  height: string;
  heightUnit: "cm" | "ft";
  weight: string;
  weightUnit: "kg" | "lbs";
}

interface BodyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BodyProfileData) => void;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function SelectField({ label, value, options, onChange, placeholder }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-white/20 bg-transparent text-left"
      >
        <span className={value ? "text-white" : "text-slate-400"}>
          {value || placeholder || label}
        </span>
        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-xl border border-white/20 overflow-hidden z-20">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition ${value === option ? "bg-main/20 text-main" : "text-white"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  unit?: string;
  unitOptions?: string[];
  onUnitChange?: (unit: string) => void;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  unit,
  unitOptions,
  onUnitChange
}: InputFieldProps) {
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsUnitOpen(!isUnitOpen);
  };

  return (
    <div className="relative">
      <div className="flex items-center rounded-xl border border-white/20 bg-transparent overflow-hidden">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || label}
          className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-400 outline-none"
        />
        {unitOptions && unit && onUnitChange && (
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleButtonClick}
              className="px-3 py-2 mr-2 rounded-lg bg-white/10 text-white text-sm flex items-center gap-1"
            >
              {unit}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {isUnitOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setIsUnitOpen(false)}
                />
                <div
                  className="fixed bg-slate-800 rounded-lg border border-white/20 overflow-hidden z-[101] min-w-[60px]"
                  style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                >
                  {unitOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnitChange(opt);
                        setIsUnitOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition ${unit === opt ? "bg-main/20 text-main" : "text-white"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BodyProfileModal({ isOpen, onClose, onSave }: BodyProfileModalProps) {
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  // Load data from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("quizAnswers");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const answers = parsed.answers || {};
          const units = parsed.units || {};

          // Gender: id 3, options: ["Male", "Female", "Other"]
          const genderOptions = ["Male", "Female", "Other"];
          if (answers[3] !== undefined) {
            setGender(genderOptions[answers[3]] || "");
          }

          // Height: id 5
          if (answers[5] !== undefined) {
            setHeight(String(answers[5]));
          }
          if (units[5]) {
            setHeightUnit(units[5] as "cm" | "ft");
          }

          // Weight: id 6
          if (answers[6] !== undefined) {
            setWeight(String(answers[6]));
          }
          if (units[6]) {
            setWeightUnit(units[6] as "kg" | "lbs");
          }

          // Date of Birth (stored separately in bodyProfile)
          const bodyProfile = localStorage.getItem("bodyProfile");
          if (bodyProfile) {
            const profile = JSON.parse(bodyProfile);
            if (profile.dateOfBirth) {
              setDateOfBirth(profile.dateOfBirth);
            }
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    // Save to quizAnswers
    const stored = localStorage.getItem("quizAnswers");
    let quizData = stored ? JSON.parse(stored) : { answers: {}, units: {}, workoutType: "home" };

    const genderOptions = ["Male", "Female", "Other"];
    const genderIndex = genderOptions.indexOf(gender);

    if (genderIndex !== -1) {
      quizData.answers[3] = genderIndex;
    }
    if (height) {
      quizData.answers[5] = height;
      quizData.units[5] = heightUnit;
    }
    if (weight) {
      quizData.answers[6] = weight;
      quizData.units[6] = weightUnit;
    }
    quizData.timestamp = new Date().toISOString();

    localStorage.setItem("quizAnswers", JSON.stringify(quizData));

    // Save dateOfBirth separately
    const bodyProfile = {
      dateOfBirth,
      gender,
      height,
      heightUnit,
      weight,
      weightUnit,
    };
    localStorage.setItem("bodyProfile", JSON.stringify(bodyProfile));

    // Clear generated plan so it regenerates with new data
    localStorage.removeItem("generatedPlan");

    onSave({
      gender,
      dateOfBirth,
      height,
      heightUnit,
      weight,
      weightUnit,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full md:items-center md:justify-center md:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full h-full max-w-full md:max-w-[400px] md:h-auto md:max-h-[90vh]">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-10 flex flex-col h-full md:min-h-[600px] md:max-h-[90vh]">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <header className="flex items-center gap-4 px-4 py-4">
              <Button
                onClick={onClose}
                className="flex items-center justify-center rounded-lg p-1 transition hover:bg-white/10"
              >
                <ChevronLeftIcon className="h-6 w-6 text-main" />
              </Button>
              <h1 className="text-xl font-semibold text-white">Body Profile</h1>
            </header>

            {/* Form */}
            <div className="flex-1 px-4 space-y-4 overflow-y-auto">
              <SelectField
                label="Gender"
                value={gender}
                options={["Male", "Female", "Other"]}
                onChange={setGender}
                placeholder="Gender"
              />

              <InputField
                label="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="Date of Birth"
                type="date"
              />

              <InputField
                label="Height"
                value={height}
                onChange={setHeight}
                placeholder="Height"
                type="number"
                unit={heightUnit}
                unitOptions={["cm", "ft"]}
                onUnitChange={(u) => setHeightUnit(u as "cm" | "ft")}
              />

              <InputField
                label="Weight"
                value={weight}
                onChange={setWeight}
                placeholder="Weight"
                type="number"
                unit={weightUnit}
                unitOptions={["kg", "lbs"]}
                onUnitChange={(u) => setWeightUnit(u as "kg" | "lbs")}
              />
            </div>

            {/* Save Button */}
            <div className="p-4 mt-auto">
              <Button
                onClick={handleSave}
                className="w-full py-4 rounded-xl bg-main text-white font-semibold hover:bg-main/90 transition"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
