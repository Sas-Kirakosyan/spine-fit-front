import { View, Text, Pressable, Modal } from "react-native";
import type { Exercise } from "@spinefit/shared";
import { useExerciseName } from "@spinefit/shared";
import { InfoIcon, ReplaceIcon, TrashIcon } from "../icons/Icons";
import Svg, { Path } from "react-native-svg";

interface ExerciseActionSheetProps {
  exercise: Exercise;
  onClose: () => void;
  onShowDetails: () => void;
  onStartWorkout: () => void;
  onReplace: () => void;
  onDelete: () => void;
}

function PlayIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 3l14 9-14 9V3z" />
    </Svg>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: "default" | "blue" | "red" | "green";
}) {
  const textColor =
    variant === "red" ? "text-red-400" :
    variant === "blue" ? "text-blue-400" :
    variant === "green" ? "text-emerald-400" :
    "text-white";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1F2232]"
    >
      <View className="w-8 items-center">{icon}</View>
      <Text className={`flex-1 text-sm font-semibold ${textColor}`}>{label}</Text>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="m9 18 6-6-6-6" />
      </Svg>
    </Pressable>
  );
}

export function ExerciseActionSheet({
  exercise,
  onClose,
  onShowDetails,
  onStartWorkout,
  onReplace,
  onDelete,
}: ExerciseActionSheetProps) {
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/60 justify-end">
        <Pressable onPress={() => {}} className="bg-[#0E1224] rounded-t-3xl border-t border-white/10">
          <View className="items-center pt-3 pb-2">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>
          <View className="px-4 pb-2">
            <Text className="text-white text-lg font-semibold text-center" numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View className="px-4 pb-6 gap-2">
            <ActionButton
              icon={<InfoIcon size={18} color="rgba(255,255,255,0.7)" />}
              label="View Details"
              onPress={() => { onShowDetails(); onClose(); }}
            />
            <ActionButton
              icon={<PlayIcon size={18} color="#34d399" />}
              label="View Sets"
              onPress={() => { onStartWorkout(); onClose(); }}
              variant="green"
            />
            <ActionButton
              icon={<ReplaceIcon size={18} color="#60a5fa" />}
              label="Replace"
              onPress={() => { onReplace(); onClose(); }}
              variant="blue"
            />
            <ActionButton
              icon={<TrashIcon size={18} color="#f87171" />}
              label="Delete"
              onPress={() => { onDelete(); onClose(); }}
              variant="red"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
