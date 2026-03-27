import { View } from "react-native";
import type { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = "" }: FormCardProps) {
  return (
    <View className={`rounded-[14px] bg-white p-5 mx-2.5 shadow-lg ${className}`}>
      {children}
    </View>
  );
}
