import { View, Text } from "react-native";
import { Image } from "expo-image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeMap = {
    sm: { width: 24, height: 24, textSize: "text-lg" },
    md: { width: 32, height: 32, textSize: "text-xl" },
    lg: { width: 48, height: 48, textSize: "text-3xl" },
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <Image
        source={require("../../../assets/icon.png")}
        style={{ width, height }}
        contentFit="contain"
      />
      <Text className={`text-white font-bold ${textSize}`}>SpineFit</Text>
    </View>
  );
}
