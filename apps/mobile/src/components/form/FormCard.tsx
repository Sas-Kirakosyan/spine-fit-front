import { View } from "react-native";
import type { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = "" }: FormCardProps) {
  return (
    <View className={`rounded-2xl bg-white/95 p-6 mx-4 ${className}`}>
      {children}
    </View>
  );
}
