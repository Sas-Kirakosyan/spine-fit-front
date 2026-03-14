import { View, Text, Pressable } from "react-native";
import type { Exercise } from "@spinefit/shared";
import { LazyImage } from "../common/LazyImage";
import { getExerciseImageSource } from "../../utils/imageResolver";
import { ThreeDotsIcon } from "../icons/Icons";
import { CheckIcon } from "../icons/Icons";

interface ExerciseCardProps {
  exercise: Exercise;
  onCardPress?: () => void;
  onDetailsPress?: () => void;
  onActionPress?: () => void;
  isCompleted?: boolean;
}

export function ExerciseCard({
  exercise,
  onCardPress,
  onDetailsPress,
  onActionPress,
  isCompleted = false,
}: ExerciseCardProps) {
  const imageSource = getExerciseImageSource(exercise);

  return (
    <Pressable
      onPress={onCardPress}
      className="flex-row items-center gap-3 rounded-2xl bg-[#13172A] p-3 border border-white/5"
    >
      <View className="relative">
        <LazyImage
          source={imageSource}
          style={{ width: 64, height: 64 }}
          className="rounded-xl"
          contentFit="cover"
        />
        {isCompleted && (
          <View className="absolute inset-0 bg-emerald-900/80 rounded-xl items-center justify-center">
            <CheckIcon size={24} color="#22c55e" />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text className="text-white/50 text-xs mt-1">
          {exercise.sets} sets x {exercise.reps} reps
          {exercise.weight > 0 && ` • ${exercise.weight} ${exercise.weight_unit || "kg"}`}
        </Text>
      </View>

      {onActionPress && (
        <Pressable onPress={onActionPress} className="p-2">
          <ThreeDotsIcon size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
      )}
    </Pressable>
  );
}
