import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export function Button({
  children,
  onPress,
  className = "",
  textClassName = "",
  disabled = false,
  loading = false,
  variant = "primary",
}: ButtonProps) {
  const baseClass = "py-4 rounded-2xl items-center justify-center flex-row";
  const variantClass = {
    primary: "bg-main",
    secondary: "bg-white/10",
    outline: "border border-white/20",
    ghost: "",
  }[variant];

  const textVariantClass = {
    primary: "text-white font-bold text-lg",
    secondary: "text-white font-semibold text-base",
    outline: "text-white font-semibold text-base",
    ghost: "text-main font-semibold text-base",
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text className={`${textVariantClass} ${textClassName}`}>{children}</Text>
      )}
    </Pressable>
  );
}
