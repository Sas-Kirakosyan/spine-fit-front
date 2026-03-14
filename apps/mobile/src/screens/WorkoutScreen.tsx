import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import type { Exercise, QuizAnswers, EquipmentCategory, FinishedWorkoutSummary } from "@spinefit/shared";
import {
  generateTrainingPlan,
  getNextAvailableWorkout,
  getAllReplacementExercises,
  getSuggestedReplacementExercises,
} from "@spinefit/shared";
import type { WorkoutStackParamList } from "../navigation/types";
import { ExerciseCard } from "../components/cards/ExerciseCard";
import { ExerciseActionSheet } from "../components/modals/ExerciseActionSheet";
import { ReplaceExerciseModal, type SwapDurationOption } from "../components/modals/ReplaceExerciseModal";
import { PlusIcon, ChevronRightIcon, ReplaceIcon, TrashIcon } from "../components/icons/Icons";
import { Logo } from "../components/common/Logo";
import { loadPlanFromLocalStorage, savePlanToLocalStorage } from "../storage/planStorage";
import { usePlanStore } from "../store/planStore";
import { useWorkoutStore } from "../store/workoutStore";
import { storage } from "../storage/storageAdapter";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { getCompletedWorkoutIdsSet } = usePlanStore();
  const { setWorkoutExercises: setStoreExercises, setWorkoutStartTime } = useWorkoutStore();

  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [planName, setPlanName] = useState("My Workout Plan");
  const [currentDayName, setCurrentDayName] = useState("Today's Workout");
  const [reloadCounter, setReloadCounter] = useState(0);
  const allExercises = allExercisesData as Exercise[];

  const completedWorkoutIds = getCompletedWorkoutIdsSet();

  const loadPlan = useCallback(async () => {
    try {
      setIsLoadingPlan(true);
      const existingPlan = await loadPlanFromLocalStorage();

      if (existingPlan) {
        setPlanName(existingPlan.name || "My Workout Plan");
        const nextWorkout = getNextAvailableWorkout(existingPlan, completedWorkoutIds);
        if (nextWorkout && nextWorkout.exercises.length > 0) {
          setWorkoutExercises(nextWorkout.exercises);
          setCurrentDayName(nextWorkout.dayName);
        } else if (existingPlan.workoutDays.length > 0) {
          setWorkoutExercises(existingPlan.workoutDays[0].exercises);
          setCurrentDayName(existingPlan.workoutDays[0].dayName);
        }
        return;
      }

      // No plan — try generating from quiz
      const quizDataString = await storage.getItem("quizAnswers");
      if (!quizDataString) return;

      const quizData: QuizAnswers = JSON.parse(quizDataString);
      const planSettingsStr = await storage.getItem("planSettings");
      const planSettings = planSettingsStr ? JSON.parse(planSettingsStr) : {};

      const equipmentDataStr = await storage.getItem("equipmentData");
      const equipmentData: EquipmentCategory[] = equipmentDataStr ? JSON.parse(equipmentDataStr) : [];

      const availableEquipment = equipmentData.flatMap((cat) =>
        cat.items.filter((item) => item.selected).map((item) => item.name)
      );
      const finalEquipment =
        availableEquipment.length > 0
          ? availableEquipment
          : equipmentData.length === 0
            ? Array.from(new Set(allExercises.map((ex) => ex.equipment))).filter((eq) => eq && eq !== "none")
            : ["bodyweight"];

      const historyStr = await storage.getItem("workoutHistory");
      const history: FinishedWorkoutSummary[] = historyStr ? JSON.parse(historyStr) : [];

      const bodyweightOnly = (await storage.getItem("bodyweightOnly")) === "true";

      const plan = generateTrainingPlan(
        allExercises,
        planSettings,
        quizData,
        bodyweightOnly ? ["bodyweight"] : finalEquipment,
        history
      );

      await savePlanToLocalStorage(plan);
      setPlanName(plan.name || "My Workout Plan");

      const nextWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
      if (nextWorkout && nextWorkout.exercises.length > 0) {
        setWorkoutExercises(nextWorkout.exercises);
        setCurrentDayName(nextWorkout.dayName);
      } else if (plan.workoutDays.length > 0) {
        setWorkoutExercises(plan.workoutDays[0].exercises);
        setCurrentDayName(plan.workoutDays[0].dayName);
      }
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setIsLoadingPlan(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadCounter]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  const updateCurrentWorkoutInPlan = async (
    updateFn: (exercises: Exercise[]) => Exercise[]
  ): Promise<boolean> => {
    try {
      const plan = await loadPlanFromLocalStorage();
      if (!plan) return false;

      const currentWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
      if (!currentWorkout) return false;

      const workoutIndex = plan.workoutDays.findIndex(
        (day) => day.dayNumber === currentWorkout.dayNumber && day.dayName === currentWorkout.dayName
      );
      if (workoutIndex === -1) return false;

      plan.workoutDays[workoutIndex].exercises = updateFn(plan.workoutDays[workoutIndex].exercises);
      await savePlanToLocalStorage(plan);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteExercise = async (exerciseToDelete: Exercise) => {
    await updateCurrentWorkoutInPlan((exercises) =>
      exercises.filter((ex) => ex.id !== exerciseToDelete.id)
    );
    setWorkoutExercises((prev) => prev.filter((ex) => ex.id !== exerciseToDelete.id));
  };

  const handleReplaceExercise = async (
    oldExercise: Exercise,
    selectedReplacement: Exercise,
    duration: SwapDurationOption
  ) => {
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
          setWorkoutExercises((prev) => replaceInWorkout(prev));
        }
      } else {
        const replaced = await updateCurrentWorkoutInPlan(replaceInWorkout);
        if (replaced) {
          setWorkoutExercises((prev) => replaceInWorkout(prev));
        }
      }
    } catch (error) {
      console.error("Error replacing exercise:", error);
    } finally {
      setReplaceExercise(null);
      setReplaceQuery("");
      setActionExercise(null);
    }
  };

  const allReplacementExercises = useMemo(
    () =>
      getAllReplacementExercises({
        allExercises,
        replaceExercise,
        replaceQuery,
        currentExercises: workoutExercises,
      }),
    [allExercises, replaceExercise, replaceQuery, workoutExercises]
  );

  const suggestedReplacementExercises = useMemo(
    () => getSuggestedReplacementExercises({ allReplacementExercises, replaceExercise }),
    [allReplacementExercises, replaceExercise]
  );

  const handleStartWorkout = () => {
    setStoreExercises(workoutExercises);
    setWorkoutStartTime(Date.now());
    navigation.navigate("ActiveWorkout");
  };

  const muscleCount = new Set(workoutExercises.flatMap((ex) => ex.muscle_groups)).size;
  const duration = `${Math.ceil(workoutExercises.length * 3)} min`;

  const renderSwipeActions = (exercise: Exercise) => (
    <View className="flex-row">
      <Pressable
        onPress={() => setReplaceExercise(exercise)}
        className="w-[72px] bg-[#21243A] items-center justify-center rounded-xl ml-1"
      >
        <ReplaceIcon size={20} color="white" />
        <Text className="text-white text-[10px] font-semibold mt-1">Replace</Text>
      </Pressable>
      <Pressable
        onPress={() => handleDeleteExercise(exercise)}
        className="w-[72px] bg-[#D04A40] items-center justify-center rounded-xl ml-1"
      >
        <TrashIcon size={20} color="white" />
        <Text className="text-white text-[10px] font-semibold mt-1">Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Logo size="sm" />
        <Pressable
          onPress={async () => {
            await storage.removeItem("generatedPlan");
            await storage.removeItem("completedWorkoutIds");
            setReloadCounter((c) => c + 1);
          }}
          className="border border-white/50 rounded-full px-2 py-1"
        >
          <Text className="text-white text-[10px] font-semibold">
            {t("workoutPage.buttons.regeneratePlan", "Regenerate")}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        {/* My Plan link */}
        <Pressable
          onPress={() => navigation.navigate("MyPlan")}
          className="flex-row items-center justify-between px-4 py-3"
        >
          <Text className="text-white text-base font-semibold">
            {t("workoutPage.buttons.myPlan", "My Plan")}
          </Text>
          <ChevronRightIcon size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>

        {/* Plan card */}
        <View className="mx-4 mb-4 rounded-2xl bg-[#13172A] border border-white/5 p-4">
          <Text className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
            {planName}
          </Text>
          <Text className="text-white text-xl font-bold mb-3">{currentDayName}</Text>
          <View className="flex-row gap-4">
            <View>
              <Text className="text-white/40 text-[10px] uppercase">Exercises</Text>
              <Text className="text-white text-sm font-semibold">{workoutExercises.length}</Text>
            </View>
            <View>
              <Text className="text-white/40 text-[10px] uppercase">Muscles</Text>
              <Text className="text-white text-sm font-semibold">{muscleCount}</Text>
            </View>
            <View>
              <Text className="text-white/40 text-[10px] uppercase">Duration</Text>
              <Text className="text-white text-sm font-semibold">{duration}</Text>
            </View>
          </View>
        </View>

        {/* Exercise list */}
        <View className="px-4 gap-3">
          {isLoadingPlan ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#e77d10" />
              <Text className="text-white/60 mt-3">
                {t("workoutPage.messages.loading", "Loading plan...")}
              </Text>
            </View>
          ) : workoutExercises.length > 0 ? (
            workoutExercises.map((exercise, index) => (
              <Swipeable
                key={`${exercise.id}-${index}`}
                renderRightActions={() => renderSwipeActions(exercise)}
                overshootRight={false}
                friction={2}
              >
                <ExerciseCard
                  exercise={exercise}
                  onCardPress={() => navigation.navigate("ExerciseSets", { exercise, mode: "preWorkout" })}
                  onDetailsPress={() => navigation.navigate("ExerciseDetails", { exercise })}
                  onActionPress={() => setActionExercise(exercise)}
                />
              </Swipeable>
            ))
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-white/60 text-center">
                {t("workoutPage.messages.noExercises", "No exercises yet.")}
              </Text>
              <Pressable
                onPress={() => navigation.navigate("MyPlan")}
                className="mt-3 rounded-xl bg-[#e77d10] px-6 py-2.5"
              >
                <Text className="text-white font-semibold">
                  {t("workoutPage.buttons.goToMyPlan", "Go to My Plan")}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Add exercise button */}
          <Pressable
            onPress={() => navigation.navigate("AllExercise", { returnTo: "workout" })}
            className="flex-row items-center gap-4 rounded-2xl bg-[#1B1E2B]/90 p-3 border border-white/5"
          >
            <View className="h-16 w-16 items-center justify-center rounded-xl border-2 border-stone-500">
              <PlusIcon size={28} color="#e77d10" />
            </View>
            <Text className="text-[#e77d10] text-lg font-semibold">
              {t("workoutPage.buttons.addExercise", "Add Exercise")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Start workout button */}
      {workoutExercises.length > 0 && (
        <View className="absolute bottom-24 left-0 right-0 px-4">
          <Pressable
            onPress={handleStartWorkout}
            className="h-12 rounded-xl bg-[#e77d10] items-center justify-center"
          >
            <Text className="text-white font-bold uppercase tracking-wider">
              {t("workoutPage.buttons.startWorkout", "START WORKOUT")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Action sheet */}
      {actionExercise && (
        <ExerciseActionSheet
          exercise={actionExercise}
          onClose={() => setActionExercise(null)}
          onShowDetails={() => {
            navigation.navigate("ExerciseDetails", { exercise: actionExercise });
            setActionExercise(null);
          }}
          onStartWorkout={() => {
            navigation.navigate("ExerciseSets", { exercise: actionExercise, mode: "preWorkout" });
            setActionExercise(null);
          }}
          onReplace={() => {
            setReplaceExercise(actionExercise);
            setActionExercise(null);
          }}
          onDelete={() => {
            handleDeleteExercise(actionExercise);
            setActionExercise(null);
          }}
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
          onConfirmSwap={(replacement, duration) =>
            handleReplaceExercise(replaceExercise, replacement, duration)
          }
          onClose={() => {
            setReplaceExercise(null);
            setReplaceQuery("");
          }}
        />
      )}
    </SafeAreaView>
  );
}
