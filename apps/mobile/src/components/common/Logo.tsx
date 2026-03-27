import { View, Text } from "react-native";
import { Image } from "expo-image";


interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "lg", className = "" }: LogoProps) {
  const sizeMap = {
    sm: { width: 24, height: 24, textSize: "text-lg" },
    md: { width: 32, height: 32, textSize: "text-xl" },
    lg: { width: 80, height: 80, textSize: "text-4xl" },
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <Image
        source={require("../../../../../packages/shared/public/logo/logo.png")}
        style={{ width, height }}
        contentFit="contain"
      />
      <Text className={`text-white font-bold ${textSize}`}>SpineFit</Text>
    </View>
  );
}
