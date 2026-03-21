import { useTranslation } from "react-i18next";
import QuizScrollCalendar from "@/components/Quiz/QuizScrollCalendar.tsx";

interface Field {
  id: number;
  fieldName: string;
  label: string;
  type: "radio" | "input" | "date";
  options?: string[];
  inputType?: "number" | "text";
  placeholder?: string;
  optional?: boolean;
  unitOptions?: string[];
}

interface QuizMultiFieldProps {
  fields: Field[];
  values: Record<string, string | number>;
  units?: Record<string, string>;
  onValueChange: (fieldName: string, value: string | number) => void;
  onUnitChange?: (fieldName: string, unit: string) => void;
  description?: string;
  questionId?: number;
}

export function QuizMultiField({
  fields,
  values,
  units = {},
  onValueChange,
  onUnitChange,
  description,
  questionId,
}: QuizMultiFieldProps) {
  const { t } = useTranslation();

  const getFieldLabel = (field: Field) => {
    if (questionId) {
      const key = `quiz.questions.${questionId}.fields.${field.fieldName}.label`;
      const translated = t(key, { defaultValue: "" });
      if (translated) return translated;
    }
    return field.label;
  };

  const getFieldPlaceholder = (field: Field) => {
    if (questionId) {
      const key = `quiz.questions.${questionId}.fields.${field.fieldName}.placeholder`;
      const translated = t(key, { defaultValue: "" });
      if (translated) return translated;
    }
    return field.placeholder;
  };

  const getOptionDisplay = (field: Field, option: string, idx: number) => {
    if (questionId) {
      const key = `quiz.questions.${questionId}.fields.${field.fieldName}.options.${idx}`;
      const translated = t(key, { defaultValue: "" });
      if (translated) return translated;
    }
    return option;
  };

  const getDescription = () => {
    if (questionId && description) {
      const key = `quiz.questions.${questionId}.description`;
      const translated = t(key, { defaultValue: "" });
      if (translated) return translated;
    }
    return description;
  };

  const translatedDescription = getDescription();

  return (
    <div className="flex flex-col gap-4 w-full">
      {translatedDescription && (
        <p className="text-sm text-background mb-2">{translatedDescription}</p>
      )}

      {fields.map((field) => {
        const label = getFieldLabel(field);
        return (
          <div key={field.fieldName} className="w-full">
            <label className="block text-sm text-background mb-2">
              {label}
            </label>

            {field.type === "radio" && field.options && (
              <select
                value={values[field.fieldName] || ""}
                onChange={(e) => onValueChange(field.fieldName, e.target.value)}
                className="w-full bg-background border border-gray-700 placeholder-white rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled hidden>
                  {t("quiz.multiField.select", { label: label.toLowerCase() })}
                </option>
                {field.options.map((option, idx) => (
                  <option key={idx} value={option} className="rounded-lg">
                    {getOptionDisplay(field, option, idx)}
                  </option>
                ))}
              </select>
            )}

            {field.type === "input" && (
              <div className="flex gap-2">
                <input
                  type={field.inputType || "text"}
                  value={values[field.fieldName] || ""}
                  onChange={(e) =>
                    onValueChange(
                      field.fieldName,
                      field.inputType === "number"
                        ? parseFloat(e.target.value) || ""
                        : e.target.value,
                    )
                  }
                  placeholder={getFieldPlaceholder(field)}
                  className="appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none
                             [-moz-appearance:textfield]
                             flex-1
                             bg-background border
                             border-gray-700
                             placeholder-white
                             rounded-lg
                             px-4
                             py-3
                             text-white
                             focus:outline-none
                             focus:border-blue-500"
                />
                {field.unitOptions && field.unitOptions.length > 0 && (
                  <select
                    value={units[field.fieldName] || field.unitOptions[0]}
                    onChange={(e) =>
                      onUnitChange?.(field.fieldName, e.target.value)
                    }
                    className="bg-background border placeholder-white border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-w-[80px]"
                  >
                    {field.unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {field.type === "date" && (
                <QuizScrollCalendar
                  value={(values?.[field.fieldName] as string)  || ""}
                  onChange={(val: string) => onValueChange(field.fieldName, val) }
                />
            )}
          </div>
        );
      })}

      {description && (
        <div className="flex items-start gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">i</span>
          </div>
          <p className="text-sm text-gray-400">
            {t("quiz.multiField.weightInfo")}
          </p>
        </div>
      )}
    </div>
  );
}
