import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { QuizModal } from "../components/quiz/QuizModal";
import { Logo } from "../components/common/Logo";
import { LanguageSelector } from "../components/common/LanguageSelector";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const handleQuizComplete = () => {
    navigation.getParent()?.navigate("GeneratingPlan");
  };

  return (
    <>
      <ImageBackground
        source={require("../../../../packages/shared/public/exercisesSm/home-page.webp")}
        style={{ flex: 1 }}
        contentFit="cover"
      >
        <View className="flex-1 bg-black/30">
          <SafeAreaView className="flex-1 justify-between pb-8">
            <View className="flex-row items-center justify-between pl-1">
              <Logo size="lg" text={t("homePage.logoText")} />
              <View className="mr-4 mt-4">
                <LanguageSelector />
              </View>
            </View>

            <View className="px-4">
              <View className="py-4">
                <Text
                  className="text-white text-4xl font-semibold leading-tight"
                  style={{ letterSpacing: -0.9 }}
                >
                  {t("homePage.heading1")}{"\n"}{t("homePage.heading2")}
                </Text>
                <Text className="text-white/80 text-sm mt-2" style={{ maxWidth: 480 }}>
                  {t("homePage.subheading")}
                </Text>
              </View>

              <View className="mt-10 gap-4">
                <Pressable
                  onPress={() => setIsQuizOpen(true)}
                  className="w-full max-w-[370px] items-center rounded-[18px] bg-main py-4 shadow-lg"
                  style={({ pressed }) => [
                    { minHeight: 56, elevation: 8, shadowColor: "#e77d10", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text
                    className="text-lg font-semibold uppercase text-white"
                    style={{ letterSpacing: 18 * 0.08 }}
                  >
                    {t("homePage.startProgram")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate("Login")}
                  className="w-full items-center py-2"
                >
                  <Text className="text-lg font-medium text-white/90">{t("homePage.logIn")}</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onQuizComplete={handleQuizComplete}
        onNavigateToLogin={() => navigation.navigate("Login")}
      />
    </>
  );
}
