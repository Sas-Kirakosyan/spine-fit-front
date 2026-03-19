import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, type DateData } from "react-native-calendars";
import { formatDateTime, isSameDay } from "@spinefit/shared";
import { Logo } from "../components/common/Logo";
import { useHistoryStore } from "../store/historyStore";
import type { FinishedWorkoutSummary } from "@spinefit/shared";
import Svg, { Path } from "react-native-svg";

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

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</Text>
      <Text className="text-lg font-semibold text-white">{value}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { workoutHistory } = useHistoryStore();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const sorted = useMemo(
    () =>
      [...workoutHistory].sort(
        (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
      ),
    [workoutHistory]
  );

  const filtered = useMemo(() => {
    if (!selectedDate) return sorted;
    const sel = new Date(selectedDate);
    return sorted.filter((w) => isSameDay(new Date(w.finishedAt), sel));
  }, [selectedDate, sorted]);

  // Build marked dates for calendar (dots on workout days)
  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    for (const w of workoutHistory) {
      const d = new Date(w.finishedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      marks[key] = { marked: true, dotColor: "#e77d10" };
    }
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        marked: marks[selectedDate]?.marked ?? false,
        dotColor: marks[selectedDate]?.dotColor ?? "#e77d10",
        selected: true,
        selectedColor: "#e77d10",
      };
    }
    return marks;
  }, [workoutHistory, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate((prev) => (prev === day.dateString ? "" : day.dateString));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-2">
        <Logo size="sm" />
        <Text className="text-white text-2xl font-bold mt-1 ml-2">History</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40, gap: 16, paddingTop: 8 }}>
        {/* Calendar */}
        <View className="rounded-2xl bg-[#1B1E2B] border border-white/5 overflow-hidden">
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: "#1B1E2B",
              calendarBackground: "#1B1E2B",
              textSectionTitleColor: "rgba(255,255,255,0.4)",
              selectedDayBackgroundColor: "#e77d10",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#e77d10",
              dayTextColor: "#ffffff",
              textDisabledColor: "rgba(255,255,255,0.2)",
              dotColor: "#e77d10",
              selectedDotColor: "#ffffff",
              arrowColor: "#e77d10",
              monthTextColor: "#ffffff",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Workout list */}
        {filtered.length === 0 ? (
          <View className="rounded-2xl bg-[#1B1E2B]/80 p-8 items-center gap-4 border border-white/5">
            <DumbbellIcon size={48} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/40 text-sm text-center">
              {selectedDate ? "No workouts on selected date" : "No completed workouts yet"}
            </Text>
          </View>
        ) : (
          filtered.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkoutCard({ workout }: { workout: FinishedWorkoutSummary }) {
  return (
    <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5">
      <View className="flex-row justify-between mb-3">
        <Text className="text-white text-sm">{formatDateTime(workout.finishedAt)}</Text>
        <Text className="text-white text-sm font-semibold">Duration: {workout.duration}</Text>
      </View>

      <View className="flex-row gap-3 mb-3">
        <HistoryMetric label="Volume" value={`${workout.totalVolume.toLocaleString()} kg`} />
        <HistoryMetric label="Calories" value={`${workout.caloriesBurned} kcal`} />
      </View>
      <View className="flex-row gap-3 mb-3">
        <HistoryMetric label="Exercises" value={`${workout.exerciseCount}`} />
        <HistoryMetric
          label="Records"
          value={`${workout.completedExerciseLogs ? Object.keys(workout.completedExerciseLogs).length : 0}`}
        />
      </View>

      {workout.completedExercises.map((ex) => (
        <View key={`${workout.id}-${ex.id}`} className="rounded-xl border border-white/10 bg-[#111427]/80 p-3 mt-1">
          <Text className="text-sm font-semibold text-white">{ex.name}</Text>
        </View>
      ))}
    </View>
  );
}
