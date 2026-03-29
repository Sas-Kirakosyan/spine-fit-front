import { useState } from "react";
import { View, Text, Pressable, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { QuizModal } from "../components/quiz/QuizModal";
import { Logo } from "../components/common/Logo";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const handleQuizComplete = () => {
    navigation.getParent()?.navigate("Main");
  };

  return (
    <>
      <ImageBackground
        source={{
          uri: "https://blog.nasm.org/hubfs/bodybuilding-divisions.jpg",
        }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/30">
          <SafeAreaView className="flex-1 justify-between pb-8">
            <View className="px-4 pt-4">
              <Logo size="lg" />
            </View>

            <View className="mt-10 gap-6 px-4">
              <View className="px-4">
                <Text className="text-white mb-10 text-4xl font-semibold leading-tight">
                  Strength instead{"\n"}Of pain
                </Text>
              </View>
              <Pressable
                onPress={() => setIsQuizOpen(true)}
                className="w-full max-w-[370px] rounded-[18px] bg-main py-4 items-center"
              >
                <Text className="text-lg font-semibold text-white">
                  START PROGRAM
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate("Login")}
                className="w-full py-2 items-center"
              >
                <Text className="text-base font-medium text-white">Log In</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onQuizComplete={handleQuizComplete}
      />
    </>
  );
}
