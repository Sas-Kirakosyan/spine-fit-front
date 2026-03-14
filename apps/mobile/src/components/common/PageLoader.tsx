import { View, ActivityIndicator } from "react-native";
import { colors } from "../../theme";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className = "" }: PageLoaderProps) {
  return (
    <View className={`absolute inset-0 items-center justify-center bg-[#080A14]/80 z-50 ${className}`}>
      <ActivityIndicator size="large" color={colors.main} />
    </View>
  );
}
