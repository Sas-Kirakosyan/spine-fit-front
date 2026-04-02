import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Exercise } from "@spinefit/shared";
import { useExerciseName } from "@spinefit/shared";
import type { WorkoutStackParamList } from "../navigation/types";
import { LazyImage } from "../components/common/LazyImage";
import { getExerciseImageSource } from "../utils/imageResolver";
import { ChevronLeftIcon, CheckIcon, CloseIcon } from "../components/icons/Icons";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, "ExerciseDetails">;

const formatLabel = (value: string) =>
  value
    .split(/[_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

export default function ExerciseDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { exercise } = route.params;
  const { getExerciseName } = useExerciseName();
  const exerciseDisplayName = getExerciseName(exercise);
  const imageSource = getExerciseImageSource(exercise);

  const detailPills = [
    { label: "Difficulty", value: formatLabel(exercise.difficulty), color: "bg-[#e77d10]/20" },
    { label: "Equipment", value: formatLabel(exercise.equipment), color: "bg-emerald-500/20" },
    { label: "Primary Muscles", value: exercise.muscle_groups.map(formatLabel).join(", "), color: "bg-purple-500/20" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#161827]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero image */}
        <View className="relative h-56 w-full overflow-hidden">
          <LazyImage
            source={imageSource}
            style={{ width: "100%" as any, height: 224 }}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-[#161827] via-transparent to-black/40" />
          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-black/50 items-center justify-center"
          >
            <ChevronLeftIcon size={20} color="white" />
          </Pressable>
          {/* Title overlay */}
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-[#e77d10]/70 text-[10px] font-semibold uppercase tracking-[3px] mb-2">
              Technique Breakdown
            </Text>
            <Text className="text-white text-2xl font-bold">{exerciseDisplayName}</Text>
            {exercise.description && (
              <Text className="text-white/70 text-sm mt-1" numberOfLines={3}>
                {exercise.description}
              </Text>
            )}
          </View>
        </View>

        <View className="px-4 gap-6 pt-4">
          {/* Detail pills */}
          <View className="gap-3">
            {detailPills.map((pill) => (
              <View key={pill.label} className={`rounded-2xl ${pill.color} p-4`}>
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  {pill.label}
                </Text>
                <Text className="text-white text-sm font-medium mt-2">{pill.value}</Text>
                <View className="mt-3 h-1 rounded-full bg-white/10" />
              </View>
            ))}
          </View>

          {/* Instructions */}
          {exercise.instructions && (
            <View className="gap-2">
              <Text className="text-white text-lg font-semibold">Instructions</Text>
              <Text className="text-white/70 text-sm leading-relaxed">{exercise.instructions}</Text>
            </View>
          )}

          {/* Back-friendly guidance */}
          <View className="rounded-2xl bg-[#0E1224]/80 p-4 border border-white/5 gap-4">
            <View className="flex-row items-center gap-3">
              <View
                className={`h-10 w-10 rounded-full items-center justify-center ${
                  exercise.is_back_friendly ? "bg-emerald-500/10" : "bg-rose-500/10"
                }`}
              >
                {exercise.is_back_friendly ? (
                  <CheckIcon size={20} color="#6ee7b7" />
                ) : (
                  <CloseIcon size={20} color="#fda4af" />
                )}
              </View>
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Back-Friendly Guidance
                </Text>
                <Text
                  className={`text-sm font-semibold ${
                    exercise.is_back_friendly ? "text-emerald-200" : "text-rose-200"
                  }`}
                >
                  {exercise.is_back_friendly ? "Approved for most back issues" : "Use with caution"}
                </Text>
              </View>
            </View>

            {exercise.back_issue_restrictions?.map((restriction) => (
              <View
                key={restriction.id}
                className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4"
              >
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                  {formatLabel(restriction.issue_type)}
                </Text>
                <Text className="text-sm text-amber-100/90 mt-2">
                  Recommendation: {restriction.recommendation}
                </Text>
                <Text className="text-xs uppercase tracking-wider text-amber-300/80 mt-1">
                  Restriction level: {formatLabel(restriction.restriction_level)}
                </Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Text className="text-xs uppercase tracking-widest text-white/40">Ready to perform?</Text>
            <View className="flex-row gap-3">
              {exercise.video_url && (
                <Pressable
                  onPress={() => Linking.openURL(exercise.video_url)}
                  className="flex-1 h-12 rounded-full bg-[#e77d10] items-center justify-center"
                >
                  <Text className="text-white text-sm font-semibold">Watch Demo</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  navigation.navigate("ExerciseSets", { exercise, mode: "preWorkout" })
                }
                className="flex-1 h-12 rounded-full border border-[#e77d10]/60 items-center justify-center"
              >
                <Text className="text-[#e77d10]/70 text-sm font-semibold">View Sets</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
