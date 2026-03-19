import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert, Modal, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PlanSettings, PlanFieldId, EquipmentCategory, GeneratedPlan, QuizAnswers, Exercise, FinishedWorkoutSummary } from "@spinefit/shared";
import { planFieldsConfig, generateTrainingPlan } from "@spinefit/shared";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import type { WorkoutStackParamList } from "../navigation/types";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ThreeDotsIcon } from "../components/icons/Icons";
import { loadPlanSettings, savePlanSettings } from "../storage/planSettingsStorage";
import { savePlanToLocalStorage } from "../storage/planStorage";
import { storage } from "../storage/storageAdapter";
import { useHistoryStore } from "../store/historyStore";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3">
      <Text className="text-base font-medium text-white">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-base font-medium text-white/70">{value}</Text>
        <ChevronRightIcon size={16} color="rgba(255,255,255,0.4)" />
      </View>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">{title}</Text>;
}

export default function MyPlanScreen() {
  const navigation = useNavigation<Nav>();
  const { workoutHistory } = useHistoryStore();

  const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
  const [bodyweightOnly, setBodyweightOnly] = useState(false);
  const [warmUpSets, setWarmUpSets] = useState(true);
  const [circuitsAndSupersets, setCircuitsAndSupersets] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<PlanFieldId | null>(null);
  const [modalSelectedIndex, setModalSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const settings = await loadPlanSettings();
      setPlanSettings(settings);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const saved = await storage.getJSON<EquipmentCategory[]>("equipmentData");
          if (saved) {
            const count = saved.reduce((t, c) => t + c.items.filter((i) => i.selected).length, 0);
            setSelectedCount(count);
          }
        } catch {}
      })();
    }, [])
  );

  const handleFieldPress = (fieldId: PlanFieldId) => {
    if (!planSettings) return;
    setCurrentField(fieldId);
    const idx = planFieldsConfig[fieldId].options.findIndex((o) => o === planSettings[fieldId]);
    setModalSelectedIndex(idx >= 0 ? idx : null);
    setModalVisible(true);
  };

  const handleModalApply = async () => {
    if (currentField && modalSelectedIndex !== null && planSettings) {
      const newSettings = { ...planSettings, [currentField]: planFieldsConfig[currentField].options[modalSelectedIndex] };
      setPlanSettings(newSettings);
      await savePlanSettings(newSettings);
    }
    setModalVisible(false);
    setCurrentField(null);
  };

  const handleGeneratePlan = async () => {
    if (!planSettings) return;
    setIsGenerating(true);
    try {
      const quizData = await storage.getJSON<QuizAnswers>("quizAnswers");
      if (!quizData) {
        Alert.alert("Quiz Required", "Please complete the onboarding quiz first.");
        setIsGenerating(false);
        return;
      }
      const eqData = (await storage.getJSON<EquipmentCategory[]>("equipmentData")) ?? [];
      const available = eqData.flatMap((c) => c.items.filter((i) => i.selected).map((i) => i.name));
      const finalEquipment =
        available.length > 0 ? available
        : eqData.length === 0
          ? Array.from(new Set((allExercisesData as Exercise[]).map((ex) => ex.equipment))).filter((eq) => eq && eq !== "none")
          : ["bodyweight"];

      const plan = generateTrainingPlan(
        allExercisesData as Exercise[], planSettings, quizData,
        bodyweightOnly ? ["bodyweight"] : finalEquipment,
        workoutHistory as FinishedWorkoutSummary[]
      );
      await savePlanToLocalStorage(plan);
      setGeneratedPlan(plan);
      Alert.alert("Plan Generated!", `${plan.name}\n\n${plan.workoutDays.length} workouts/week, ${plan.workoutDays[0]?.exercises.length || 0} exercises/day.`);
    } catch {
      Alert.alert("Error", "Failed to generate plan. Check settings and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!planSettings) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold text-center mr-10">My Plan</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100, gap: 20 }}>
        {/* Goal */}
        <Pressable onPress={() => handleFieldPress("goal")} className="rounded-2xl bg-[#e77d10] p-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-white">Goal</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-white">{planSettings.goal}</Text>
            <ChevronRightIcon size={16} color="white" />
          </View>
        </Pressable>

        {/* Location */}
        <View>
          <SectionTitle title="LOCATION" />
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-white">My Gym</Text>
              <ChevronDownIcon size={14} color="rgba(255,255,255,0.5)" />
            </View>
            <ThreeDotsIcon size={18} color="rgba(255,255,255,0.5)" />
          </View>
          <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5 gap-4">
            <Pressable onPress={() => navigation.navigate("AvailableEquipment")} className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-white">Equipment</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-medium text-white/70">{selectedCount} Selected</Text>
                <ChevronRightIcon size={16} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-white">Bodyweight-Only</Text>
              <Switch value={bodyweightOnly} onValueChange={setBodyweightOnly} trackColor={{ false: "#3e3e3e", true: "#e77d10" }} thumbColor="white" />
            </View>
          </View>
        </View>

        {/* Training Profile */}
        <View>
          <SectionTitle title="TRAINING PROFILE" />
          <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5 gap-1">
            <SettingRow label="Workouts / Week" value={planSettings.workoutsPerWeek} onPress={() => handleFieldPress("workoutsPerWeek")} />
            <SettingRow label="Duration" value={planSettings.duration} onPress={() => handleFieldPress("duration")} />
            <SettingRow label="Experience" value={planSettings.experience} onPress={() => handleFieldPress("experience")} />
          </View>
        </View>

        {/* Training Format */}
        <View>
          <SectionTitle title="TRAINING FORMAT" />
          <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5 gap-1">
            <SettingRow label="Training Split" value={planSettings.trainingSplit} onPress={() => handleFieldPress("trainingSplit")} />
            <SettingRow label="Exercise Variability" value={planSettings.exerciseVariability} onPress={() => handleFieldPress("exerciseVariability")} />
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base font-medium text-white">Warm-Up Sets</Text>
              <Switch value={warmUpSets} onValueChange={setWarmUpSets} trackColor={{ false: "#3e3e3e", true: "#e77d10" }} thumbColor="white" />
            </View>
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base font-medium text-white">Circuits & Supersets</Text>
              <Switch value={circuitsAndSupersets} onValueChange={setCircuitsAndSupersets} trackColor={{ false: "#3e3e3e", true: "#e77d10" }} thumbColor="white" />
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View>
          <SectionTitle title="PREFERENCES" />
          <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5 gap-1">
            <SettingRow label="Units" value={planSettings.units} onPress={() => handleFieldPress("units")} />
            <SettingRow label="Cardio" value={planSettings.cardio} onPress={() => handleFieldPress("cardio")} />
            <SettingRow label="Stretching" value={planSettings.stretching} onPress={() => handleFieldPress("stretching")} />
          </View>
        </View>

        {generatedPlan && (
          <View>
            <SectionTitle title="GENERATED PLAN" />
            <View className="rounded-2xl bg-[#1B1E2B] p-4 border border-white/5 gap-3">
              <Text className="text-lg font-semibold text-white">{generatedPlan.name}</Text>
              <Text className="text-sm text-white/40">Created: {new Date(generatedPlan.createdAt).toLocaleDateString()}</Text>
              {generatedPlan.workoutDays.map((day) => (
                <View key={day.dayNumber} className="border-t border-white/10 pt-3">
                  <Text className="text-base font-medium text-white">{day.dayName}</Text>
                  <Text className="text-sm text-white/40">{day.exercises.length} exercises</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-2">
        <Pressable onPress={handleGeneratePlan} disabled={isGenerating} className={`h-[50px] rounded-2xl items-center justify-center ${isGenerating ? "bg-[#e77d10]/50" : "bg-[#e77d10]"}`}>
          {isGenerating ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-lg">Generate Plan</Text>}
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#080A14] rounded-t-3xl max-h-[80%]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-2xl font-semibold text-white">{currentField ? planFieldsConfig[currentField].title : ""}</Text>
              <Pressable onPress={handleModalApply} className="rounded-xl bg-white/10 px-4 py-2">
                <Text className="text-white text-sm font-medium">Done</Text>
              </Pressable>
            </View>
            {currentField && planFieldsConfig[currentField].headerDescription && (
              <View className="mx-5 mb-3 rounded-xl bg-[#e77d10]/80 px-4 py-3">
                <Text className="text-white text-sm">{planFieldsConfig[currentField].headerDescription}</Text>
              </View>
            )}
            <ScrollView className="px-5 pb-8" contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
              {currentField && planFieldsConfig[currentField].options.map((option, index) => (
                <Pressable
                  key={option}
                  onPress={() => setModalSelectedIndex(index)}
                  className={`rounded-2xl p-4 border ${modalSelectedIndex === index ? "border-[#e77d10] bg-[#e77d10]/20" : "border-white/10 bg-[#1B1E2B]"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${modalSelectedIndex === index ? "border-[#e77d10] bg-[#e77d10]" : "border-white/30"}`}>
                      {modalSelectedIndex === index && <View className="h-2 w-2 rounded-full bg-white" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{option}</Text>
                      {planFieldsConfig[currentField].description?.[index] && (
                        <Text className="text-white/40 text-xs mt-1">{planFieldsConfig[currentField].description[index]}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
