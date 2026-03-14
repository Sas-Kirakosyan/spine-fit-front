import { View, Text, TextInput, Pressable } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import type { Exercise, ExerciseSetRow, SetField } from "@spinefit/shared";
import { CheckIcon, TrashIcon } from "../icons/Icons";

interface ExerciseSetProps {
  index: number;
  setEntry: ExerciseSetRow;
  exercise: Exercise;
  previousValue: string;
  isActive: boolean;
  isCompleted: boolean;
  canDelete: boolean;
  canLogSet: boolean;
  onActivate: (index: number) => void;
  onValueChange: (index: number, field: SetField, value: string) => void;
  onLogSet: (index: number) => void;
  onDelete: (index: number) => void;
}

export function ExerciseSet({
  index,
  setEntry,
  exercise,
  previousValue,
  isActive,
  isCompleted,
  canDelete,
  canLogSet,
  onActivate,
  onValueChange,
  onLogSet,
  onDelete,
}: ExerciseSetProps) {
  const isBodyweight = exercise.equipment === "bodyweight" || exercise.weight_unit === "bodyweight";
  const canSwipeToDelete = canDelete && !isCompleted;

  const renderRightActions = () => {
    if (!canSwipeToDelete) return null;
    return (
      <Pressable
        onPress={() => onDelete(index)}
        className="bg-red-500 justify-center items-center rounded-xl ml-2"
        style={{ width: 72 }}
      >
        <TrashIcon size={20} color="white" />
        <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
      </Pressable>
    );
  };

  const bgColor = isCompleted
    ? "bg-[#0F4A05]"
    : isActive
      ? "bg-[#171C2F]"
      : "bg-[#0E1326]";

  return (
    <Swipeable
      renderRightActions={canSwipeToDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <View className={`flex-row items-center gap-2 rounded-2xl px-2.5 py-2 ${bgColor}`}>
        {/* Set number */}
        <View className="w-10 items-center">
          <Text className="text-3xl font-semibold text-[#e77d10]/90">{index + 1}</Text>
        </View>

        {/* Previous value */}
        <View className="flex-1 min-w-0">
          <Text className="text-[15px] font-medium text-white/70" numberOfLines={1}>
            {previousValue}
          </Text>
        </View>

        {/* Weight input */}
        <TextInput
          value={setEntry.weight}
          editable={!isCompleted && !isBodyweight}
          placeholder={isBodyweight ? "-" : "0"}
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="numeric"
          onFocus={() => onActivate(index)}
          onChangeText={(value) => onValueChange(index, "weight", value)}
          className="h-9 w-16 rounded-lg border border-transparent bg-transparent text-center text-2xl font-semibold text-white"
          style={{ fontVariant: ["tabular-nums"] }}
        />

        {/* Reps input */}
        <TextInput
          value={setEntry.reps}
          editable={!isCompleted}
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="numeric"
          onFocus={() => onActivate(index)}
          onChangeText={(value) => onValueChange(index, "reps", value)}
          className="h-9 w-16 rounded-lg border border-transparent bg-transparent text-center text-2xl font-semibold text-white"
          style={{ fontVariant: ["tabular-nums"] }}
        />

        {/* Log button */}
        <Pressable
          onPress={() => onLogSet(index)}
          disabled={!canLogSet}
          className={`h-11 w-14 rounded-full items-center justify-center border ${
            isCompleted
              ? "border-[#69FF2F] bg-[#69FF2F]"
              : canLogSet
                ? "border-white/20 bg-white/20"
                : "border-white/10 bg-white/10"
          }`}
        >
          <CheckIcon
            size={24}
            color={isCompleted ? "#061404" : canLogSet ? "white" : "rgba(255,255,255,0.5)"}
          />
        </Pressable>
      </View>
    </Swipeable>
  );
}
