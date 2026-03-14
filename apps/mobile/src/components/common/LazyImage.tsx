import { useState } from "react";
import { View, type ViewStyle } from "react-native";
import { Image } from "expo-image";

interface LazyImageProps {
  source: { uri: string } | number;
  style?: ViewStyle & { width?: number; height?: number };
  className?: string;
  contentFit?: "contain" | "cover" | "fill";
}

export function LazyImage({
  source,
  style,
  className = "",
  contentFit = "contain",
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View
        className={`bg-gray-700 items-center justify-center ${className}`}
        style={style}
      />
    );
  }

  return (
    <View className={className} style={style}>
      {isLoading && (
        <View className="absolute inset-0 bg-gray-700/50 rounded-lg" />
      )}
      <Image
        source={source}
        style={{ width: "100%", height: "100%" }}
        contentFit={contentFit}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        transition={200}
      />
    </View>
  );
}
