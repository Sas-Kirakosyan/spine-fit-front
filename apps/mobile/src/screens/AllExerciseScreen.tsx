import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Exercise } from "@spinefit/shared";
import { useExerciseName } from "@spinefit/shared";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import type { WorkoutStackParamList } from "../navigation/types";
import { ChevronLeftIcon, SearchIcon, CloseIcon, CheckIcon } from "../components/icons/Icons";
import { useExerciseGrouping } from "../hooks/useExerciseGrouping";
import { useExerciseSelection } from "../hooks/useExerciseSelection";
import { useWorkoutStore } from "../store/workoutStore";
import { useCreateProgramStore } from "../store/createProgramStore";

type Route = RouteProp<WorkoutStackParamList, "AllExercise">;

export default function AllExerciseScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { returnTo } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { getExerciseName } = useExerciseName();
  const exercises = allExercisesData as Exercise[];
  const groupedExercises = useExerciseGrouping(exercises, searchQuery, getExerciseName);
  const { selectedExercises, toggleExercise, clearSelection, getSelectedExercises, selectedCount } = useExerciseSelection();

  const addExercises = useWorkoutStore((s) => s.addExercises);
  const { activeDayId, setDays, days } = useCreateProgramStore();

  const handleAdd = useCallback(() => {
    const selected = getSelectedExercises(exercises);
    if (selected.length === 0) return;

    if (returnTo === "workout") {
      addExercises(selected);
    } else if (returnTo === "createProgram" && activeDayId) {
      setDays(
        days.map((d) =>
          d.id === activeDayId ? { ...d, exercises: [...d.exercises, ...selected] } : d
        )
      );
    }

    clearSelection();
    navigation.goBack();
  }, [getSelectedExercises, exercises, returnTo, addExercises, activeDayId, setDays, days, clearSelection, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold">All Exercises</Text>
        <Pressable onPress={() => setShowSearch(!showSearch)} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          {showSearch ? <CloseIcon size={18} color="white" /> : <SearchIcon size={18} color="white" />}
        </Pressable>
      </View>

      {showSearch && (
        <View className="px-4 mb-3">
          <TextInput
            className="rounded-xl bg-[#1B1E2B] border border-white/10 px-4 py-3 text-white text-sm"
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: selectedCount > 0 ? 100 : 40 }}>
        {Object.keys(groupedExercises).length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-white/40 text-sm">No exercises found</Text>
          </View>
        ) : (
          Object.entries(groupedExercises).map(([groupKey, groupExercises]) => (
            <View key={groupKey} className="mb-4">
              <Text className="text-[#e77d10] font-bold text-sm mb-2">{groupKey}</Text>
              <View className="gap-1">
                {groupExercises.map((exercise) => {
                  const isSelected = selectedExercises.has(exercise.id);
                  return (
                    <Pressable
                      key={exercise.id}
                      onPress={() => toggleExercise(exercise.id)}
                      className={`flex-row items-center p-3 rounded-xl ${isSelected ? "bg-[#e77d10]/20 border border-[#e77d10]/40" : "bg-[#1B1E2B] border border-white/5"}`}
                    >
                      <View className="flex-1">
                        <Text className="text-white text-sm font-medium">{getExerciseName(exercise)}</Text>
                        <Text className="text-white/40 text-xs">{exercise.muscle_groups?.join(", ")}</Text>
                      </View>
                      <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-[#e77d10] bg-[#e77d10]" : "border-white/20"}`}>
                        {isSelected && <CheckIcon size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {selectedCount > 0 && (
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-[#080A14]/95">
          <Pressable onPress={handleAdd} className="h-[50px] rounded-2xl bg-[#e77d10] items-center justify-center">
            <Text className="text-white font-semibold text-base">Add {selectedCount} Exercise{selectedCount > 1 ? "s" : ""}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
