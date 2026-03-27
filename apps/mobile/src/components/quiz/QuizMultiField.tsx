import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { QuizDatePicker, formatDate } from "./QuizDatePicker";

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
}

export function QuizMultiField({
  fields,
  values,
  units = {},
  onValueChange,
  onUnitChange,
  description,
}: QuizMultiFieldProps) {
  const [activeDateField, setActiveDateField] = useState<string | null>(null);

  return (
    <View className="gap-4 w-full">
      {description && (
        <Text className="text-lg text-[#132f54] mb-2">{description}</Text>
      )}

      {fields.map((field) => (
        <View key={field.fieldName} className="w-full">
          <Text className="text-lg text-[#132f54] mb-2">{field.label}</Text>

          {field.type === "radio" && field.options && (
            <View className="flex-row flex-wrap gap-2">
              {field.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => onValueChange(field.fieldName, option)}
                  className={`px-4 py-3 rounded-lg border-2 ${
                    values[field.fieldName] === option
                      ? "border-main bg-main/10"
                      : "border-gray-700 bg-[#132f54]"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      values[field.fieldName] === option ? "text-main" : "text-white"
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {field.type === "input" && (
            <View className="flex-row gap-2">
              <TextInput
                value={String(values[field.fieldName] || "")}
                onChangeText={(text) => {
                  if (field.inputType === "number") {
                    const num = parseFloat(text);
                    onValueChange(field.fieldName, isNaN(num) ? "" : num);
                  } else {
                    onValueChange(field.fieldName, text);
                  }
                }}
                placeholder={field.placeholder}
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType={field.inputType === "number" ? "numeric" : "default"}
                className="flex-1 rounded-lg border border-gray-700 bg-[#132f54] px-4 py-3 text-2xl text-white"
              />
              {field.unitOptions && field.unitOptions.length > 0 && (
                <View className="flex-row rounded-lg border border-gray-700 overflow-hidden">
                  {field.unitOptions.map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => onUnitChange?.(field.fieldName, unit)}
                      className={`px-3 py-3 ${
                        (units[field.fieldName] || field.unitOptions![0]) === unit
                          ? "bg-main"
                          : "bg-[#132f54]"
                      }`}
                    >
                      <Text
                        className={`text-xl font-medium ${
                          (units[field.fieldName] || field.unitOptions![0]) === unit
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {field.type === "date" && (
            <>
              <Pressable
                onPress={() => setActiveDateField(field.fieldName)}
                className="rounded-lg border border-gray-700 bg-[#132f54] px-4 py-3"
              >
                <Text className="text-2xl text-white">
                  {values[field.fieldName]
                    ? formatDate(String(values[field.fieldName]))
                    : "Select date"}
                </Text>
              </Pressable>
              <QuizDatePicker
                visible={activeDateField === field.fieldName}
                value={values[field.fieldName] ? String(values[field.fieldName]) : undefined}
                onConfirm={(dateStr) => {
                  setActiveDateField(null);
                  onValueChange(field.fieldName, dateStr);
                }}
                onCancel={() => setActiveDateField(null)}
              />
            </>
          )}
        </View>
      ))}

      {description && (
        <View className="flex-row items-start gap-2 mt-2">
          <View className="w-5 h-5 rounded-full bg-gray-700 items-center justify-center">
            <Text className="text-white text-base">i</Text>
          </View>
          <Text className="text-lg text-gray-400 flex-1">
            Weight needed to calculate calories burned
          </Text>
        </View>
      )}
    </View>
  );
}
