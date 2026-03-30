import { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ProgressStackParamList } from "../navigation/types";
import { ChevronLeftIcon } from "../components/icons/Icons";
import { useHistoryStore } from "../store/historyStore";
import { formatVolume, useExerciseName } from "@spinefit/shared";

type Route = RouteProp<ProgressStackParamList, "ExerciseProgress">;

export default function ExerciseProgressScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { exerciseId } = route.params;
  const { getExerciseName } = useExerciseName();
  const { workoutHistory } = useHistoryStore();

  const exerciseData = useMemo(() => {
    const sessions: { date: string; sets: any[]; volume: number }[] = [];
    let exerciseName = "";

    for (const workout of workoutHistory) {
      const ex = workout.completedExercises?.find((e) => e.id === exerciseId);
      if (!ex) continue;
      if (!exerciseName) exerciseName = ex.name;

      const logs = workout.completedExerciseLogs?.[exerciseId] || [];
      let sessionVolume = 0;
      for (const set of logs) {
        if (set.completed) {
          sessionVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }
      }
      sessions.push({
        date: workout.finishedAt,
        sets: logs.filter((s) => s.completed),
        volume: sessionVolume,
      });
    }

    // Max weight, max reps, max volume
    let maxWeight = 0, maxReps = 0, maxVolume = 0;
    for (const session of sessions) {
      if (session.volume > maxVolume) maxVolume = session.volume;
      for (const set of session.sets) {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        if (w > maxWeight) maxWeight = w;
        if (r > maxReps) maxReps = r;
      }
    }

    // Estimated 1RM
    let est1RM = 0;
    for (const session of sessions) {
      for (const set of session.sets) {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        if (w > 0 && r > 0 && r <= 30) {
          const e = w * (1 + r / 30);
          if (e > est1RM) est1RM = e;
        }
      }
    }

    return { exerciseName, sessions: sessions.reverse(), maxWeight, maxReps, maxVolume, est1RM };
  }, [exerciseId, workoutHistory]);

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-lg font-semibold text-center mr-10" numberOfLines={1}>
          {exerciseData.exerciseName ? getExerciseName({ id: exerciseId, name: exerciseData.exerciseName }) : "Exercise"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
        {/* Records */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Est. 1RM</Text>
            <Text className="text-xl font-bold text-[#e77d10] mt-1">{exerciseData.est1RM > 0 ? `${exerciseData.est1RM.toFixed(1)} kg` : "—"}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Max Weight</Text>
            <Text className="text-xl font-bold text-white mt-1">{exerciseData.maxWeight > 0 ? `${exerciseData.maxWeight} kg` : "—"}</Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Max Reps</Text>
            <Text className="text-xl font-bold text-white mt-1">{exerciseData.maxReps > 0 ? String(exerciseData.maxReps) : "—"}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Best Volume</Text>
            <Text className="text-xl font-bold text-white mt-1">{exerciseData.maxVolume > 0 ? `${formatVolume(exerciseData.maxVolume)} kg` : "—"}</Text>
          </View>
        </View>

        {/* Session history */}
        <Text className="text-white text-base font-semibold mt-2">Session History</Text>
        {exerciseData.sessions.length === 0 ? (
          <View className="rounded-2xl bg-[#1B1E2B] p-6 items-center border border-white/5">
            <Text className="text-white/40 text-sm">No sessions recorded yet</Text>
          </View>
        ) : (
          exerciseData.sessions.map((session, i) => (
            <View key={i} className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white/60 text-xs">{new Date(session.date).toLocaleDateString()}</Text>
                <Text className="text-white/60 text-xs">{formatVolume(session.volume)} kg vol</Text>
              </View>
              {session.sets.map((set, j) => (
                <View key={j} className="flex-row items-center gap-2 py-1">
                  <Text className="text-[#e77d10] text-sm font-semibold w-8">{j + 1}</Text>
                  <Text className="text-white text-sm">{set.weight || "BW"} kg × {set.reps} reps</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
