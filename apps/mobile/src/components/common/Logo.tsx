import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";

const logoSource = require("../../../../../packages/shared/public/logo/logo.png");

interface LogoProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  onPress?: () => void;
  className?: string;
}

export function Logo({ size = "lg", text, onPress, className = "" }: LogoProps) {
  // Whole logo acts as a button when onPress is given (mirrors the web Logo's onClick)
  const Container = onPress ? Pressable : View;

  // "lg" mirrors the web hero Logo: 88px icon, spaced-caps wordmark + caps subtitle
  if (size === "lg") {
    return (
      <Container onPress={onPress} className={`flex-row items-center ${className}`}>
        <Image source={logoSource} style={{ width: 88, height: 88 }} contentFit="contain" />
        <View className="mb-4">
          <Text
            className="text-white font-semibold uppercase"
            style={{ fontSize: 26, letterSpacing: 26 * 0.34 }}
          >
            SpineFit
          </Text>
          {text ? (
            <Text className="text-white font-semibold uppercase" style={{ fontSize: 14 }}>
              {text}
            </Text>
          ) : null}
        </View>
      </Container>
    );
  }

  const sizeMap = {
    sm: { width: 24, height: 24, textSize: "text-lg" },
    md: { width: 32, height: 32, textSize: "text-xl" },
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <Container onPress={onPress} className={`flex-row items-center gap-2 ${className}`}>
      <Image source={logoSource} style={{ width, height }} contentFit="contain" />
      <View>
        <Text className={`text-white font-bold ${textSize}`}>SpineFit</Text>
        {text ? <Text className="text-sm text-white/80">{text}</Text> : null}
      </View>
    </Container>
  );
}
