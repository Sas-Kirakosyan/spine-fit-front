import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, TextInput } from "react-native";
import type { Exercise } from "@spinefit/shared";
import { LazyImage } from "../common/LazyImage";
import { getExerciseImageSource } from "../../utils/imageResolver";
import { SearchIcon, CloseIcon } from "../icons/Icons";

export type SwapDurationOption = "workout" | "plan";

interface ReplaceExerciseModalProps {
  replaceExercise: Exercise;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  suggestedExercises: Exercise[];
  allExercises: Exercise[];
  onConfirmSwap: (replacement: Exercise, duration: SwapDurationOption) => void;
  onClose: () => void;
}

export function ReplaceExerciseModal({
  replaceExercise,
  searchQuery,
  onSearchChange,
  suggestedExercises,
  allExercises,
  onConfirmSwap,
  onClose,
}: ReplaceExerciseModalProps) {
  const [activeTab, setActiveTab] = useState<"suggested" | "all">("suggested");
  const [swapDuration, setSwapDuration] = useState<SwapDurationOption>("workout");

  const exercises = activeTab === "suggested" ? suggestedExercises : allExercises;

  const renderExercise = ({ item }: { item: Exercise }) => {
    const imageSource = getExerciseImageSource(item);
    return (
      <Pressable
        onPress={() => onConfirmSwap(item, swapDuration)}
        className="flex-row items-center gap-3 p-2 rounded-xl bg-[#1F2232] mb-2"
      >
        <LazyImage
          source={imageSource}
          style={{ width: 48, height: 48 }}
          className="rounded-lg"
          contentFit="cover"
        />
        <View className="flex-1 min-w-0">
          <Text className="text-white text-sm font-semibold" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-white/40 text-xs" numberOfLines={1}>
            {item.muscle_groups.join(", ")}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/70 justify-end">
        <Pressable onPress={() => {}} className="bg-[#161827] rounded-t-3xl border-t border-white/10 max-h-[85%]">
          <View className="items-center pt-3 pb-2">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>

          <View className="px-4 pb-2">
            <Text className="text-white text-lg font-semibold text-center">
              Replace Exercise
            </Text>
            <Text className="text-white/40 text-sm text-center mt-1">
              Replacing: {replaceExercise.name}
            </Text>
          </View>

          {/* Duration toggle */}
          <View className="flex-row mx-4 mb-3 bg-[#1D2030] rounded-lg p-1">
            <Pressable
              onPress={() => setSwapDuration("workout")}
              className={`flex-1 py-2 rounded-md items-center ${swapDuration === "workout" ? "bg-[#e77d10]" : ""}`}
            >
              <Text className={`text-xs font-semibold ${swapDuration === "workout" ? "text-white" : "text-white/50"}`}>
                This Workout
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSwapDuration("plan")}
              className={`flex-1 py-2 rounded-md items-center ${swapDuration === "plan" ? "bg-[#e77d10]" : ""}`}
            >
              <Text className={`text-xs font-semibold ${swapDuration === "plan" ? "text-white" : "text-white/50"}`}>
                Entire Plan
              </Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View className="flex-row mx-4 mb-3 bg-[#1D2030] rounded-lg p-1">
            <Pressable
              onPress={() => setActiveTab("suggested")}
              className={`flex-1 py-2 rounded-md items-center ${activeTab === "suggested" ? "bg-white/10" : ""}`}
            >
              <Text className={`text-xs font-semibold ${activeTab === "suggested" ? "text-white" : "text-white/50"}`}>
                Suggested
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("all")}
              className={`flex-1 py-2 rounded-md items-center ${activeTab === "all" ? "bg-white/10" : ""}`}
            >
              <Text className={`text-xs font-semibold ${activeTab === "all" ? "text-white" : "text-white/50"}`}>
                All Exercises
              </Text>
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center mx-4 mb-3 h-11 bg-[#1D2030] rounded-xl border border-white/10 px-3">
            <SearchIcon size={16} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search exercise..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 ml-2 text-white text-sm"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchChange("")}>
                <CloseIcon size={16} color="rgba(255,255,255,0.4)" />
              </Pressable>
            )}
          </View>

          {/* Exercise list */}
          <FlatList
            data={exercises}
            renderItem={renderExercise}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Text className="text-white/40 text-sm">No exercises found</Text>
              </View>
            }
          />

          {/* Cancel */}
          <View className="px-4 pb-6">
            <Pressable
              onPress={onClose}
              className="h-11 rounded-xl bg-[#232639] items-center justify-center"
            >
              <Text className="text-white text-sm font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
