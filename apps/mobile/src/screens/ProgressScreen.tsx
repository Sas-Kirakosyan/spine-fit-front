import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import type { VolumePeriod, ExerciseProgress as ExProgress } from "@spinefit/shared";
import {
  calculateTotalStats,
  getWeeklyActivity,
  getProgressDataByPeriod,
  getAllExercisesWithProgress,
  formatVolume,
} from "@spinefit/shared";
import type { ProgressStackParamList } from "../navigation/types";
import { Logo } from "../components/common/Logo";
import { SettingsIcon, CheckIcon } from "../components/icons/Icons";
import { useHistoryStore } from "../store/historyStore";
import Svg, { Path } from "react-native-svg";

type Nav = NativeStackNavigationProp<ProgressStackParamList>;

function DumbbellIcon({ size = 40, color = "#e77d10" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m6.5 6.5 11 11" />
      <Path d="m21 21-1-1" />
      <Path d="m3 3 1 1" />
      <Path d="m18 22 4-4" />
      <Path d="m2 6 4-4" />
      <Path d="m3 10 7-7" />
      <Path d="m14 21 7-7" />
    </Svg>
  );
}

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const { workoutHistory } = useHistoryStore();
  const [activeTab, setActiveTab] = useState<"overview" | "exercise">("overview");
  const [volumePeriod, setVolumePeriod] = useState<VolumePeriod>("month");

  const stats = useMemo(() => calculateTotalStats(workoutHistory), [workoutHistory]);
  const weeklyActivity = useMemo(() => getWeeklyActivity(workoutHistory), [workoutHistory]);
  const progressData = useMemo(() => getProgressDataByPeriod(workoutHistory, volumePeriod), [workoutHistory, volumePeriod]);
  const allExercises = useMemo(() => getAllExercisesWithProgress(workoutHistory), [workoutHistory]);
  const hasWorkouts = workoutHistory.length > 0;

  const periods: VolumePeriod[] = ["week", "month", "3months", "year"];

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <View>
          <Logo size="sm" />
          <Text className="text-white text-2xl font-bold mt-1 ml-2">Progress</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          className="bg-white/10 rounded-xl p-2"
        >
          <SettingsIcon size={20} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-white/10 mx-4">
        <Pressable
          onPress={() => setActiveTab("overview")}
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "overview" ? "border-[#e77d10]" : "border-transparent"}`}
        >
          <Text className={`text-sm font-medium ${activeTab === "overview" ? "text-white" : "text-white/40"}`}>
            Overview
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("exercise")}
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "exercise" ? "border-[#e77d10]" : "border-transparent"}`}
        >
          <Text className={`text-sm font-medium ${activeTab === "exercise" ? "text-white" : "text-white/40"}`}>
            Exercises
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40, gap: 16, paddingTop: 16 }}>
        {activeTab === "overview" && (
          <>
            {hasWorkouts ? (
              <>
                {/* Stats Grid */}
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
                    <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Total Workouts</Text>
                    <Text className="text-2xl font-bold text-white mt-1">{stats.totalWorkouts}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
                    <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Total Volume</Text>
                    <Text className="text-2xl font-bold text-white mt-1">{formatVolume(stats.totalVolume)}</Text>
                    <Text className="text-xs text-white/40">kg</Text>
                  </View>
                </View>

                {/* Weekly Activity */}
                <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
                  <Text className="text-sm font-semibold text-white mb-3">Weekly Activity</Text>
                  <View className="flex-row justify-between">
                    {weeklyActivity.map((day) => (
                      <View key={day.dayName} className="items-center gap-2">
                        <View
                          className={`h-10 w-10 rounded-full items-center justify-center ${
                            day.hasWorkout ? "bg-[#e77d10]" : "bg-white/5"
                          }`}
                        >
                          {day.hasWorkout ? (
                            <CheckIcon size={16} color="white" />
                          ) : (
                            <Text className="text-white/30">-</Text>
                          )}
                        </View>
                        <Text className={`text-[10px] font-semibold ${day.hasWorkout ? "text-[#e77d10]" : "text-white/30"}`}>
                          {day.dayName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Volume Progress - simplified (no chart library yet) */}
                <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-semibold text-white">Volume Progress</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    <View className="flex-row gap-2">
                      {periods.map((p) => (
                        <Pressable
                          key={p}
                          onPress={() => setVolumePeriod(p)}
                          className={`px-3 py-1 rounded-full ${volumePeriod === p ? "bg-[#e77d10]" : "bg-white/10"}`}
                        >
                          <Text className={`text-xs font-semibold ${volumePeriod === p ? "text-white" : "text-white/50"}`}>
                            {p === "3months" ? "3M" : p.charAt(0).toUpperCase() + p.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  {progressData.length > 0 ? (
                    <View className="flex-row items-end gap-1 h-24">
                      {progressData.map((point, i) => {
                        const maxVol = Math.max(...progressData.map((p) => p.volume));
                        const h = maxVol > 0 ? (point.volume / maxVol) * 80 : 4;
                        return (
                          <View key={i} className="flex-1 items-center justify-end">
                            <View
                              className="w-full rounded-t bg-[#e77d10]/70"
                              style={{ height: Math.max(h, 4) }}
                            />
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text className="text-white/40 text-sm text-center py-4">No data for this period</Text>
                  )}
                </View>
              </>
            ) : (
              <View className="rounded-2xl bg-[#1B1E2B]/80 p-8 items-center gap-4 border border-white/5">
                <View className="h-20 w-20 rounded-full bg-[#e77d10]/20 items-center justify-center">
                  <DumbbellIcon />
                </View>
                <Text className="text-white text-xl font-semibold">Start training</Text>
                <Text className="text-white/40 text-sm text-center max-w-[280px]">
                  Your progress, workout stats, personal records and charts will appear here after your first completed workout
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === "exercise" && (
          <>
            {allExercises.length > 0 ? (
              allExercises.map((ex: ExProgress) => (
                <Pressable
                  key={ex.exerciseId}
                  onPress={() => navigation.navigate("ExerciseProgress", { exerciseId: ex.exerciseId })}
                  className="flex-row items-center justify-between rounded-2xl bg-[#1B1E2B] p-4 border border-white/5"
                >
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">{ex.exerciseName}</Text>
                    <Text className="text-white/40 text-xs mt-1">
                      Est. 1RM: {ex.estimated1RM > 0 ? `${ex.estimated1RM.toFixed(1)} kg` : "—"}
                    </Text>
                  </View>
                  <Text className="text-white/30 text-lg">›</Text>
                </Pressable>
              ))
            ) : (
              <View className="rounded-2xl bg-[#1B1E2B]/80 p-8 items-center border border-white/5">
                <DumbbellIcon size={48} color="rgba(255,255,255,0.2)" />
                <Text className="text-white/40 text-sm text-center mt-4">
                  Your estimated 1RM by exercise will appear here after completed workouts.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
