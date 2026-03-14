import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TrainingDay, SavedProgram } from "@spinefit/shared";
import type { WorkoutStackParamList } from "../navigation/types";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon, PlusIcon } from "../components/icons/Icons";
import { useCreateProgramStore } from "../store/createProgramStore";
import { storage } from "../storage/storageAdapter";

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

export default function CreateProgramScreen() {
  const navigation = useNavigation<Nav>();
  const { days, programName, editingProgramId, setDays, setProgramName, setActiveDayId, reset } = useCreateProgramStore();
  const [expandedDayId, setExpandedDayId] = useState<string | null>(days.length > 0 ? days[0]?.id : null);
  const isEditing = Boolean(editingProgramId);

  const handleAddDay = useCallback(() => {
    const newDay: TrainingDay = { id: `day-${Date.now()}`, name: `Day ${days.length + 1}`, exercises: [] };
    setDays([...days, newDay]);
    setExpandedDayId(newDay.id);
  }, [days, setDays]);

  const handleRemoveDay = useCallback(
    (dayId: string) => {
      setDays(days.filter((d) => d.id !== dayId));
      if (expandedDayId === dayId) setExpandedDayId(null);
    },
    [days, setDays, expandedDayId]
  );

  const handleDayNameChange = useCallback(
    (dayId: string, name: string) => {
      setDays(days.map((d) => (d.id === dayId ? { ...d, name } : d)));
    },
    [days, setDays]
  );

  const handleRemoveExercise = useCallback(
    (dayId: string, exerciseId: number) => {
      setDays(days.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((ex) => ex.id !== exerciseId) } : d)));
    },
    [days, setDays]
  );

  const handleAddExercise = useCallback(
    (dayId: string) => {
      setActiveDayId(dayId);
      navigation.navigate("AllExercise", { returnTo: "createProgram" });
    },
    [setActiveDayId, navigation]
  );

  const handleSave = useCallback(async () => {
    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
    if (!programName.trim() || days.length === 0 || totalExercises === 0) return;

    const existing = (await storage.getJSON<SavedProgram[]>("savedPrograms")) ?? [];

    if (editingProgramId) {
      const updated = existing.map((p) =>
        p.id === editingProgramId ? { ...p, name: programName.trim(), days } : p
      );
      await storage.setJSON("savedPrograms", updated);
    } else {
      const program: SavedProgram = {
        id: `program-${Date.now()}`,
        name: programName.trim(),
        days,
        createdAt: new Date().toISOString(),
      };
      await storage.setJSON("savedPrograms", [...existing, program]);
    }

    Alert.alert("Saved!", "Program saved successfully.");
    reset();
    navigation.goBack();
  }, [programName, days, editingProgramId, reset, navigation]);

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
  const canSave = programName.trim().length > 0 && days.length > 0 && totalExercises > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold text-center mr-10">
          {isEditing ? "Edit Program" : "Create Program"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Program Name */}
        <View className="mb-6">
          <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">Program Name</Text>
          <TextInput
            className="rounded-xl bg-[#1B1E2B] border border-white/10 px-4 py-3 text-white text-base"
            placeholder="e.g. My PPL Program"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={programName}
            onChangeText={setProgramName}
          />
        </View>

        {/* Training Days */}
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">
          Training Days ({days.length})
        </Text>

        {days.length === 0 ? (
          <View className="items-center py-12 rounded-xl bg-[#1B1E2B]/50 border border-dashed border-white/10 mb-4">
            <Text className="text-white/40 text-sm">No training days added yet</Text>
            <Text className="text-white/20 text-xs mt-1">Tap the button below to add a training day</Text>
          </View>
        ) : (
          <View className="gap-3 mb-4">
            {days.map((day) => (
              <View key={day.id} className="rounded-xl bg-[#1B1E2B] border border-white/5 overflow-hidden">
                <Pressable
                  onPress={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                  className="flex-row items-center p-3 gap-3"
                >
                  <Text className={`text-white/50 text-xs ${expandedDayId === day.id ? "rotate-90" : ""}`}>▶</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">{day.name}</Text>
                    <Text className="text-white/40 text-xs">{day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <Pressable onPress={() => handleRemoveDay(day.id)} className="p-2">
                    <TrashIcon size={16} color="rgba(248,113,113,0.6)" />
                  </Pressable>
                </Pressable>

                {expandedDayId === day.id && (
                  <View className="px-3 pb-3 border-t border-white/5">
                    {/* Day name edit */}
                    <TextInput
                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm mt-3 mb-2"
                      value={day.name}
                      onChangeText={(text) => handleDayNameChange(day.id, text)}
                      placeholder="Day name"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />

                    {day.exercises.map((exercise) => (
                      <View key={exercise.id} className="flex-row items-center p-3 rounded-xl bg-white/5 mt-2 gap-3">
                        <View className="flex-1">
                          <Text className="text-white font-medium text-sm">{exercise.name}</Text>
                          <Text className="text-white/40 text-xs">{exercise.sets}×{exercise.reps} @ {exercise.weight}{exercise.weight_unit || "kg"}</Text>
                        </View>
                        <Pressable onPress={() => handleRemoveExercise(day.id, exercise.id)} className="p-1">
                          <TrashIcon size={14} color="rgba(248,113,113,0.6)" />
                        </Pressable>
                      </View>
                    ))}

                    <Pressable
                      onPress={() => handleAddExercise(day.id)}
                      className="flex-row items-center gap-2 p-3 mt-2 rounded-lg border border-dashed border-[#e77d10]/30"
                    >
                      <PlusIcon size={16} color="#e77d10" />
                      <Text className="text-[#e77d10] text-sm font-medium">Add Exercise</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add Day Button */}
        <Pressable onPress={handleAddDay} className="flex-row items-center gap-3 p-4 rounded-xl bg-[#1B1E2B]/80 border border-dashed border-[#e77d10]/30">
          <View className="h-10 w-10 rounded-lg bg-[#e77d10]/10 items-center justify-center">
            <PlusIcon size={20} color="#e77d10" />
          </View>
          <Text className="text-[#e77d10] font-semibold">Add Training Day</Text>
        </Pressable>
      </ScrollView>

      {/* Save Button */}
      <View className="px-4 pb-6 pt-2">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`h-[50px] rounded-2xl items-center justify-center ${canSave ? "bg-[#e77d10]" : "bg-[#e77d10]/30"}`}
        >
          <Text className={`font-semibold text-lg ${canSave ? "text-white" : "text-white/30"}`}>Save Program</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
