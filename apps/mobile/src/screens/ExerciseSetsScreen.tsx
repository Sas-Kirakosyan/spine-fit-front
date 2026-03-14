import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Exercise, ExerciseSetRow, SetField } from "@spinefit/shared";
import type { WorkoutStackParamList } from "../navigation/types";
import { ExerciseSet } from "../components/exercise/ExerciseSet";
import { RestTimerModal } from "../components/modals/RestTimerModal";
import { LazyImage } from "../components/common/LazyImage";
import { getExerciseImageSource } from "../utils/imageResolver";
import { CloseIcon } from "../components/icons/Icons";
import { useWorkoutStore } from "../store/workoutStore";
import Svg, { Path, Circle, Rect } from "react-native-svg";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, "ExerciseSets">;

function TimerIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2 2" />
      <Path d="M9 3h6" />
      <Path d="M10 6h4" />
    </Svg>
  );
}

function VideoIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 10l4.553-3.165A1 1 0 0 1 21 7.656v8.688a1 1 0 0 1-1.447.821L15 14z" />
      <Rect x={3} y={6} width={12} height={12} rx={2} />
    </Svg>
  );
}

export default function ExerciseSetsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { exercise, mode } = route.params;
  const isDuringActiveWorkout = mode === "activeWorkout";

  const { exerciseLogs, markExerciseComplete, setWorkoutStartTime } = useWorkoutStore();
  const savedLogs = exerciseLogs[exercise.id];
  const isBodyweight = exercise.equipment === "bodyweight";

  const generateSetId = () => `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const createNewSet = (template?: Partial<ExerciseSetRow>): ExerciseSetRow => ({
    id: generateSetId(),
    reps: exercise.reps != null ? String(exercise.reps) : "",
    weight: exercise.weight != null ? String(exercise.weight) : "",
    completed: false,
    ...template,
  });

  const [sets, setSets] = useState<ExerciseSetRow[]>(() => {
    if (savedLogs && savedLogs.length > 0) {
      return savedLogs.map((log) => ({ ...log, id: log.id || generateSetId() }));
    }
    const count = Math.max(exercise.sets || 1, 1);
    return Array.from({ length: count }, () => createNewSet());
  });

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [painLevel, setPainLevel] = useState(2);
  const [restTimerModalOpen, setRestTimerModalOpen] = useState(false);
  const [restTimerEnabled, setRestTimerEnabled] = useState(false);
  const [restDurationMinutes, setRestDurationMinutes] = useState(1);
  const [restDurationSeconds, setRestDurationSeconds] = useState(0);
  const [restCountdownSeconds, setRestCountdownSeconds] = useState<number | null>(null);
  const [restPaused, setRestPaused] = useState(false);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore saved logs
  useEffect(() => {
    if (savedLogs && savedLogs.length > 0) {
      setSets(savedLogs.map((log) => ({ ...log, id: log.id || generateSetId() })));
      const firstIncomplete = savedLogs.findIndex((s) => !s.completed);
      setActiveSetIndex(firstIncomplete !== -1 ? firstIncomplete : -1);
    } else {
      const count = Math.max(exercise.sets || 1, 1);
      setSets(Array.from({ length: count }, () => createNewSet()));
      setActiveSetIndex(0);
    }
  }, [exercise.id]);

  // Rest timer countdown
  useEffect(() => {
    if (restCountdownSeconds === null || restCountdownSeconds <= 0 || restPaused) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      if (restCountdownSeconds === 0) setRestCountdownSeconds(null);
      return;
    }
    restIntervalRef.current = setInterval(() => {
      setRestCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [restCountdownSeconds, restPaused]);

  const findNextPendingIndex = (list: ExerciseSetRow[], startFrom = 0): number => {
    for (let i = startFrom; i < list.length; i++) {
      if (!list[i].completed) return i;
    }
    return -1;
  };

  const isSetValid = (setEntry: ExerciseSetRow): boolean => {
    const reps = Number(setEntry.reps);
    const hasValidReps = setEntry.reps.trim() !== "" && !Number.isNaN(reps) && reps > 0;
    if (isBodyweight) return hasValidReps;
    return hasValidReps && setEntry.weight.trim() !== "" && !Number.isNaN(Number(setEntry.weight)) && Number(setEntry.weight) >= 0;
  };

  const handleSetValueChange = (index: number, field: SetField, value: string) => {
    if (sets[index]?.completed) return;
    if (value.includes("-")) return;
    if (value !== "" && Number(value) < 0) return;

    setActiveSetIndex(index);
    setSets((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddSet = () => {
    setSets((prev) => {
      const next = [...prev, createNewSet()];
      if (activeSetIndex === -1) setActiveSetIndex(next.length - 1);
      return next;
    });
  };

  const handleDeleteSet = (index: number) => {
    setSets((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveSetIndex((prevIndex) => {
        if (prevIndex >= next.length) return Math.max(0, next.length - 1);
        if (prevIndex > index) return prevIndex - 1;
        if (prevIndex === index) {
          const nextIncomplete = next.findIndex((s) => !s.completed);
          return nextIncomplete !== -1 ? nextIncomplete : Math.min(prevIndex, next.length - 1);
        }
        return prevIndex;
      });
      return next;
    });
  };

  const handleLogSet = (requestedIndex?: number) => {
    if (sets.length === 0) return;
    const targetIndex =
      typeof requestedIndex === "number"
        ? requestedIndex
        : activeSetIndex >= 0 && activeSetIndex < sets.length
          ? activeSetIndex
          : -1;
    if (targetIndex === -1) return;

    const targetSet = sets[targetIndex];
    const shouldUnlog = targetSet.completed;
    if (!shouldUnlog && !isSetValid(targetSet)) return;

    setSets((prev) => {
      const updated = prev.map((item, i) =>
        i === targetIndex ? { ...item, completed: !shouldUnlog } : item
      );
      if (shouldUnlog) {
        setActiveSetIndex(targetIndex);
      } else {
        const nextAfter = findNextPendingIndex(updated, targetIndex + 1);
        const fallback = nextAfter !== -1 ? nextAfter : findNextPendingIndex(updated, 0);
        setActiveSetIndex(fallback);
      }
      return updated;
    });

    if (!shouldUnlog && restTimerEnabled && isDuringActiveWorkout) {
      const totalSeconds = restDurationMinutes * 60 + restDurationSeconds;
      if (totalSeconds > 0) setRestCountdownSeconds(totalSeconds);
    }
  };

  const handleLogAllSets = () => {
    const incompleteSets = sets.filter((s) => !s.completed);
    if (incompleteSets.length === 0) return;
    if (!incompleteSets.every(isSetValid)) return;

    setSets((prev) => prev.map((item) => ({ ...item, completed: true })));
    setActiveSetIndex(-1);
  };

  const handleCompleteExercise = () => {
    if (sets.length === 0) return;
    if (isDuringActiveWorkout) {
      markExerciseComplete(exercise.id, sets.map((s) => ({ ...s })));
      navigation.goBack();
      return;
    }
    // Pre-workout mode: start workout
    setWorkoutStartTime(Date.now());
    navigation.navigate("ActiveWorkout");
  };

  const allSetsCompleted = sets.length > 0 && sets.every((s) => s.completed);
  const canLogAllSets = useMemo(() => {
    const incomplete = sets.filter((s) => !s.completed);
    return incomplete.length > 0 && incomplete.every(isSetValid);
  }, [sets]);

  const getPreviousValue = (index: number) => {
    const hasTemplate = index < Math.max(exercise.sets || 1, 1);
    if (!hasTemplate) return "—";
    const repsVal = exercise.reps != null ? String(exercise.reps) : "";
    if (!repsVal) return "—";
    if (isBodyweight) return `BW x ${repsVal}`;
    const weightVal = exercise.weight != null ? String(exercise.weight) : "";
    if (!weightVal) return "—";
    const unit = exercise.weight_unit?.trim() || "kg";
    return `${weightVal}${unit} x ${repsVal}`;
  };

  const painFaces = [
    { id: 1, label: "🙂", value: 1 },
    { id: 2, label: "😊", value: 3 },
    { id: 3, label: "😐", value: 5 },
    { id: 4, label: "🙁", value: 7 },
    { id: 5, label: "😣", value: 9 },
  ];

  const imageSource = getExerciseImageSource(exercise);

  return (
    <SafeAreaView className="flex-1 bg-[#0E1224]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
        {/* Hero image */}
        <View className="relative h-56 w-full overflow-hidden rounded-b-3xl">
          <LazyImage
            source={imageSource}
            style={{ width: "100%" as any, height: 224 }}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-black/50 items-center justify-center"
          >
            <CloseIcon size={16} color="white" />
          </Pressable>
          {/* How-to button */}
          {exercise.video_url && (
            <Pressable
              onPress={() => Linking.openURL(exercise.video_url)}
              className="absolute top-4 right-4 flex-row items-center gap-1.5 bg-[#e77d10] rounded-full px-3 py-2"
            >
              <VideoIcon size={14} color="white" />
              <Text className="text-white text-xs font-semibold">How-To</Text>
            </Pressable>
          )}
          {/* Exercise name */}
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-white text-2xl font-bold">{exercise.name}</Text>
          </View>
        </View>

        {/* Toolbar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <Pressable
            onPress={isDuringActiveWorkout ? () => setRestTimerModalOpen(true) : undefined}
            className={`flex-row items-center gap-2 px-3 py-2 rounded-full border ${restTimerEnabled ? "border-[#e77d10]/70" : "border-white/10"}`}
          >
            <TimerIcon size={14} color={restTimerEnabled ? "#e77d10" : "white"} />
            <Text className={`text-xs font-semibold ${restTimerEnabled ? "text-[#e77d10]/70" : "text-white"}`}>
              Rest timer: {restTimerEnabled ? "on" : "off"}
            </Text>
          </Pressable>
        </ScrollView>

        {/* Active rest countdown */}
        {isDuringActiveWorkout && restCountdownSeconds != null && restCountdownSeconds > 0 && (
          <View className="mx-4 flex-row items-center justify-center gap-3 rounded-2xl border border-[#e77d10] bg-[#e77d10]/40 px-4 py-3">
            <View className="h-9 w-9 rounded-full bg-black/30 items-center justify-center">
              <TimerIcon size={18} color="white" />
            </View>
            <Text className="text-white text-lg font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
              Rest: {Math.floor(restCountdownSeconds / 60)}:{(restCountdownSeconds % 60).toString().padStart(2, "0")}
            </Text>
            <Pressable
              onPress={() => (restPaused ? setRestPaused(false) : setRestPaused(true))}
              className="h-9 w-9 rounded-full bg-white/10 items-center justify-center"
            >
              <Text className="text-white text-xs">{restPaused ? "▶" : "⏸"}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRestCountdownSeconds(null);
                setRestPaused(false);
              }}
              className="h-9 w-9 rounded-full bg-white/10 items-center justify-center"
            >
              <CloseIcon size={16} color="white" />
            </Pressable>
          </View>
        )}

        {/* Sets section */}
        <View className="mx-4 rounded-3xl border border-white/10 bg-[#13172A] p-3">
          {/* Header row */}
          <View className="flex-row items-center px-2.5 pb-2">
            <Text className="w-10 text-center text-sm font-medium text-white/80">Set</Text>
            <Text className="flex-1 text-sm font-medium text-white/80">Previous</Text>
            <Text className="w-16 text-center text-sm font-medium text-white/80">{isBodyweight ? "BW" : "Kg"}</Text>
            <Text className="w-16 text-center text-sm font-medium text-white/80">Reps</Text>
            <View className="w-14" />
          </View>

          {/* Set rows */}
          <View className="gap-2">
            {sets.map((setEntry, index) => (
              <ExerciseSet
                key={setEntry.id}
                index={index}
                setEntry={setEntry}
                exercise={exercise}
                previousValue={getPreviousValue(index)}
                isActive={index === activeSetIndex}
                isCompleted={setEntry.completed}
                canDelete={sets.length > 1}
                canLogSet={setEntry.completed || isSetValid(setEntry)}
                onActivate={(i) => !sets[i]?.completed && setActiveSetIndex(i)}
                onValueChange={handleSetValueChange}
                onLogSet={handleLogSet}
                onDelete={handleDeleteSet}
              />
            ))}
          </View>

          {/* Add set */}
          <Pressable
            onPress={handleAddSet}
            className="mt-4 h-14 items-center justify-center rounded-full bg-[#1D1F27]"
          >
            <Text className="text-white/90 text-2xl font-semibold">+ Add Set</Text>
          </Pressable>
        </View>

        {/* Pain level */}
        {allSetsCompleted && (
          <View className="mx-4 rounded-3xl border border-white/10 bg-[#161A30] p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-semibold uppercase tracking-widest text-white/70">
                Pain Level
              </Text>
              <View className="bg-[#e77d10] rounded-full px-3 py-1">
                <Text className="text-xs font-semibold text-white">{painLevel}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              {painFaces.map((face) => (
                <Text
                  key={face.id}
                  className="text-2xl"
                  style={{ opacity: Math.abs(face.value - painLevel) <= 1 ? 1 : 0.3 }}
                >
                  {face.label}
                </Text>
              ))}
            </View>
            {/* Simple pain buttons */}
            <View className="flex-row justify-between">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setPainLevel(level)}
                  className={`h-8 w-8 rounded-full items-center justify-center ${painLevel === level ? "bg-[#e77d10]" : "bg-white/10"}`}
                >
                  <Text className={`text-xs font-semibold ${painLevel === level ? "text-white" : "text-white/50"}`}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Bottom action */}
        <View className="mx-9">
          {allSetsCompleted ? (
            <Pressable
              onPress={handleCompleteExercise}
              className="h-11 rounded-xl bg-emerald-500 items-center justify-center"
            >
              <Text className="text-white font-semibold uppercase tracking-widest">DONE</Text>
            </Pressable>
          ) : isDuringActiveWorkout ? (
            <Pressable
              onPress={handleLogAllSets}
              disabled={!canLogAllSets}
              className={`h-12 rounded-xl items-center justify-center ${canLogAllSets ? "bg-[#e77d10]" : "bg-[#e77d10]/50"}`}
            >
              <Text className="text-white font-semibold uppercase tracking-wider">LOG ALL SETS</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setWorkoutStartTime(Date.now());
                navigation.navigate("ActiveWorkout");
              }}
              className="h-11 rounded-xl bg-[#e77d10] items-center justify-center"
            >
              <Text className="text-white font-semibold uppercase tracking-wider">START WORKOUT</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Rest timer modal */}
      {isDuringActiveWorkout && (
        <RestTimerModal
          isOpen={restTimerModalOpen}
          onClose={() => setRestTimerModalOpen(false)}
          enabled={restTimerEnabled}
          onEnabledChange={setRestTimerEnabled}
          durationMinutes={restDurationMinutes}
          durationSeconds={restDurationSeconds}
          onDurationChange={(min, sec) => {
            setRestDurationMinutes(min);
            setRestDurationSeconds(sec);
          }}
          isRestRunning={restCountdownSeconds != null && restCountdownSeconds > 0}
          isRestPaused={restPaused}
          onPause={() => setRestPaused(true)}
          onResume={() => setRestPaused(false)}
          onCancelRest={() => {
            setRestCountdownSeconds(null);
            setRestPaused(false);
            setRestTimerModalOpen(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}
