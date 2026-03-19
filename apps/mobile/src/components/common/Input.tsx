import { View, Text, TextInput } from "react-native";

interface InputProps {
  label?: string;
  value: string;
  onChangeText?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  unit?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  onFocus,
  placeholder,
  unit,
  keyboardType = "default",
  secureTextEntry = false,
  disabled = false,
  className = "",
  inputClassName = "",
}: InputProps) {
  return (
    <View className={`w-full gap-2 ${className}`}>
      {label && (
        <Text
          className={`text-[11px] font-semibold uppercase tracking-[3.5px] ${
            disabled ? "text-slate-600" : "text-slate-300"
          }`}
        >
          {label}
          {unit && (
            <Text
              className={`ml-1 text-[10px] uppercase ${
                disabled ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {" "}({unit})
            </Text>
          )}
        </Text>
      )}

      {disabled ? (
        <View
          className={`h-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 ${inputClassName}`}
        >
          <Text className="text-lg font-semibold text-white/35">
            {value || placeholder || "—"}
          </Text>
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          className={`h-12 rounded-[18px] border border-white/80 bg-transparent px-5 text-lg font-semibold text-white ${inputClassName}`}
        />
      )}
    </View>
  );
}
