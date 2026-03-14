import { View, Text, Pressable, Modal } from "react-native";
import type { Exercise, ExerciseSetRow } from "@spinefit/shared";
import { calculateWorkoutVolume } from "@spinefit/shared";

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  completedExercises: Exercise[];
  duration: string;
  completedExerciseLogs?: Record<number, ExerciseSetRow[]>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-[#13172A] p-4 border border-white/10">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
        {label}
      </Text>
      <Text className="text-lg font-semibold text-white">{value}</Text>
    </View>
  );
}

export function FinishWorkoutModal({
  isOpen,
  onClose,
  onLogWorkout,
  completedExercises,
  duration,
  completedExerciseLogs = {},
}: FinishWorkoutModalProps) {
  if (!isOpen) return null;

  const volume = calculateWorkoutVolume(completedExercises, completedExerciseLogs);
  const calories = 100;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/50 justify-end">
        <Pressable onPress={() => {}} className="bg-[#0E1224] border-t border-white/20 rounded-t-3xl">
          <View className="items-center pt-4">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>

          <View className="px-6 pb-8 pt-6 gap-6">
            <Text className="text-xl font-semibold text-white text-center">
              Finish and log your workout?
            </Text>

            <View className="gap-3">
              <View className="flex-row gap-3">
                <StatBox label="VOLUME" value={`${volume.toLocaleString()} kg`} />
                <StatBox label="CALORIES" value={`${calories} kcal`} />
              </View>
              <View className="flex-row gap-3">
                <StatBox label="EXERCISES" value={String(completedExercises.length)} />
                <StatBox label="DURATION" value={duration} />
              </View>
            </View>

            <View className="flex-row gap-3 pt-2">
              <Pressable
                onPress={onClose}
                className="flex-1 h-12 rounded-xl bg-[#1A1F35] items-center justify-center"
              >
                <Text className="text-white font-semibold uppercase tracking-wider text-sm">
                  Resume
                </Text>
              </Pressable>
              <Pressable
                onPress={onLogWorkout}
                className="flex-1 h-12 rounded-xl bg-[#e77d10] items-center justify-center"
              >
                <Text className="text-white font-semibold uppercase tracking-wider text-sm">
                  Log Workout
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
