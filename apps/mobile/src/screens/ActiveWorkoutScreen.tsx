import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import type { Exercise, FinishedWorkoutSummary } from "@spinefit/shared";
import {
  formatTime,
  calculateWorkoutVolume,
  getNextAvailableWorkout,
  getAllReplacementExercises,
  getSuggestedReplacementExercises,
} from "@spinefit/shared";
import type { WorkoutStackParamList } from "../navigation/types";
import { ExerciseCard } from "../components/cards/ExerciseCard";
import { ExerciseActionSheet } from "../components/modals/ExerciseActionSheet";
import { FinishWorkoutModal } from "../components/modals/FinishWorkoutModal";
import { ReplaceExerciseModal, type SwapDurationOption } from "../components/modals/ReplaceExerciseModal";
import { ChevronLeftIcon } from "../components/icons/Icons";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import { useWorkoutStore } from "../store/workoutStore";
import { usePlanStore } from "../store/planStore";
import { useHistoryStore } from "../store/historyStore";
import { loadPlanFromLocalStorage, savePlanToLocalStorage } from "../storage/planStorage";
import { storage } from "../storage/storageAdapter";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const allExercises = allExercisesData as Exercise[];

  const {
    workoutExercises: todaysExercises,
    setWorkoutExercises: setTodaysExercises,
    completedExerciseIds,
    exerciseLogs,
    workoutStartTime,
    resetWorkoutState,
  } = useWorkoutStore();

  const { getCompletedWorkoutIdsSet, addCompletedWorkoutId, setCompletedWorkoutIds } = usePlanStore();
  const { addWorkout } = useHistoryStore();
  const completedWorkoutIds = getCompletedWorkoutIdsSet();

  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [fixedDuration, setFixedDuration] = useState("00:00:00");

  const { elapsedSeconds, formattedTime, resetToElapsed } = useWorkoutTimer({
    initialStartTime: workoutStartTime ?? undefined,
    isPaused: showFinishModal,
  });

  const completedExerciseIdsSet = useMemo(
    () => new Set(completedExerciseIds.map((id) => String(id))),
    [completedExerciseIds]
  );

  const completedExercises = useMemo(
    () => todaysExercises.filter((ex) => completedExerciseIdsSet.has(String(ex.id))),
    [completedExerciseIdsSet, todaysExercises]
  );

  const allExercisesCompleted = useMemo(
    () => todaysExercises.length > 0 && todaysExercises.every((ex) => completedExerciseIdsSet.has(String(ex.id))),
    [completedExerciseIdsSet, todaysExercises]
  );

  const updateCurrentWorkoutInPlan = async (
    updateFn: (exercises: Exercise[]) => Exercise[]
  ): Promise<boolean> => {
    try {
      const planString = await storage.getItem("generatedPlan");
      if (!planString) return false;

      const plan = JSON.parse(planString);
      const activeWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
      if (!activeWorkout) return false;

      const workoutIndex = plan.workoutDays.findIndex(
        (day: any) => day.dayNumber === activeWorkout.dayNumber && day.dayName === activeWorkout.dayName
      );
      if (workoutIndex === -1) return false;

      plan.workoutDays[workoutIndex].exercises = updateFn(plan.workoutDays[workoutIndex].exercises);
      await storage.setJSON("generatedPlan", plan);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteExercise = useCallback(async (exerciseToDelete: Exercise) => {
    const removed = await updateCurrentWorkoutInPlan((exercises) =>
      exercises.filter((ex) => ex.id !== exerciseToDelete.id)
    );
    if (removed) {
      setTodaysExercises((prev: Exercise[]) => prev.filter((ex) => ex.id !== exerciseToDelete.id));
    }
    setActionExercise(null);
  }, []);

  const handleReplaceExercise = useCallback(
    async (oldExercise: Exercise, selectedReplacement: Exercise, duration: SwapDurationOption) => {
      const replacement: Exercise = {
        ...selectedReplacement,
        sets: oldExercise.sets,
        reps: oldExercise.reps,
        weight: oldExercise.weight,
        weight_unit: oldExercise.weight_unit,
      };

      const replaceInWorkout = (exercises: Exercise[]) => {
        if (exercises.some((ex) => ex.id === replacement.id && ex.id !== oldExercise.id)) return exercises;
        return exercises.map((ex) => (ex.id === oldExercise.id ? replacement : ex));
      };

      try {
        if (duration === "plan") {
          const plan = await loadPlanFromLocalStorage();
          if (plan) {
            plan.workoutDays = plan.workoutDays.map((day) => ({
              ...day,
              exercises: replaceInWorkout(day.exercises as Exercise[]),
            }));
            await savePlanToLocalStorage(plan);
            setTodaysExercises((prev: Exercise[]) => replaceInWorkout(prev));
          }
        } else {
          const replaced = await updateCurrentWorkoutInPlan(replaceInWorkout);
          if (replaced) {
            setTodaysExercises((prev: Exercise[]) => replaceInWorkout(prev));
          }
        }
      } catch (error) {
        console.error("Error replacing exercise:", error);
      } finally {
        setReplaceExercise(null);
        setReplaceQuery("");
        setActionExercise(null);
      }
    },
    []
  );

  const allReplacementExercises = useMemo(
    () =>
      getAllReplacementExercises({
        allExercises,
        replaceExercise,
        replaceQuery,
        currentExercises: todaysExercises,
      }),
    [allExercises, replaceExercise, replaceQuery, todaysExercises]
  );

  const suggestedReplacementExercises = useMemo(
    () => getSuggestedReplacementExercises({ allReplacementExercises, replaceExercise }),
    [allReplacementExercises, replaceExercise]
  );

  const handleFinishWorkout = () => {
    if (allExercisesCompleted) {
      setFixedDuration(formatTime(elapsedSeconds));
      setShowFinishModal(true);
    } else {
      resetWorkoutState();
      navigation.goBack();
    }
  };

  const handleResume = () => {
    resetToElapsed(elapsedSeconds);
    setShowFinishModal(false);
  };

  const handleLogWorkout = async () => {
    const totalVolume = calculateWorkoutVolume(completedExercises, exerciseLogs);
    const summary: FinishedWorkoutSummary = {
      id: `${Date.now()}`,
      finishedAt: new Date().toISOString(),
      duration: fixedDuration,
      totalVolume,
      exerciseCount: completedExercises.length,
      caloriesBurned: 100,
      completedExercises,
      completedExerciseLogs: exerciseLogs,
    };

    const generatedPlan = await loadPlanFromLocalStorage();
    if (generatedPlan && todaysExercises.length > 0) {
      const currentWorkout = getNextAvailableWorkout(generatedPlan, completedWorkoutIds);
      if (currentWorkout) {
        const workoutId = `${generatedPlan.id}_${currentWorkout.dayNumber}_${currentWorkout.dayName}`;
        addCompletedWorkoutId(workoutId);

        const updatedIds = new Set(completedWorkoutIds);
        updatedIds.add(workoutId);
        const nextWorkout = getNextAvailableWorkout(generatedPlan, updatedIds);
        if (!nextWorkout) {
          const resetIds = Array.from(updatedIds).filter((id) => !id.startsWith(generatedPlan.id));
          setCompletedWorkoutIds(resetIds);
        }
      }
    }

    addWorkout(summary);
    setShowFinishModal(false);
    resetWorkoutState();
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
        >
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-lg font-semibold text-center mr-10">
          Active Workout
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120, gap: 16 }}>
        {/* Timer */}
        <View className="rounded-xl border border-white/10 bg-[#13172A] p-6 items-center">
          <Text className="text-white text-5xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
            {formattedTime}
          </Text>
        </View>

        {/* No exercises */}
        {todaysExercises.length === 0 && (
          <View className="rounded-xl border border-white/10 bg-[#13172A] p-6 items-center">
            <Text className="text-white/60">No exercises for today's workout.</Text>
            <Text className="text-white/40 text-sm mt-2">Generate a plan to get started.</Text>
          </View>
        )}

        {/* Exercise list */}
        {todaysExercises.map((exercise, index) => {
          const isCompleted = completedExerciseIdsSet.has(String(exercise.id));
          return (
            <ExerciseCard
              key={`${exercise.id}-${index}`}
              exercise={exercise}
              isCompleted={isCompleted}
              onCardPress={() =>
                navigation.navigate("ExerciseSets", { exercise, mode: "activeWorkout" })
              }
              onActionPress={() => setActionExercise(exercise)}
            />
          );
        })}

        {/* Finish button */}
        <Pressable
          onPress={handleFinishWorkout}
          className="h-11 rounded-xl bg-[#228B22] items-center justify-center mx-5"
        >
          <Text className="text-white font-semibold uppercase tracking-wider">Finish Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Action sheet */}
      {actionExercise && (
        <ExerciseActionSheet
          exercise={actionExercise}
          onClose={() => setActionExercise(null)}
          onShowDetails={() => {
            navigation.navigate("ExerciseSets", { exercise: actionExercise, mode: "activeWorkout" });
            setActionExercise(null);
          }}
          onStartWorkout={() => {
            navigation.navigate("ExerciseSets", { exercise: actionExercise, mode: "activeWorkout" });
            setActionExercise(null);
          }}
          onReplace={() => {
            setReplaceExercise(actionExercise);
            setActionExercise(null);
          }}
          onDelete={() => handleDeleteExercise(actionExercise)}
        />
      )}

      {/* Replace modal */}
      {replaceExercise && (
        <ReplaceExerciseModal
          replaceExercise={replaceExercise}
          searchQuery={replaceQuery}
          onSearchChange={setReplaceQuery}
          suggestedExercises={suggestedReplacementExercises}
          allExercises={allReplacementExercises}
          onConfirmSwap={(replacement, dur) =>
            handleReplaceExercise(replaceExercise, replacement, dur)
          }
          onClose={() => {
            setReplaceExercise(null);
            setReplaceQuery("");
          }}
        />
      )}

      {/* Finish modal */}
      <FinishWorkoutModal
        isOpen={showFinishModal}
        onClose={handleResume}
        onLogWorkout={handleLogWorkout}
        completedExercises={completedExercises}
        completedExerciseLogs={exerciseLogs}
        duration={fixedDuration}
      />
    </SafeAreaView>
  );
}
