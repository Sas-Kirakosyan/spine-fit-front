import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const MINUTES_OPTIONS = [0, 1, 2, 3, 4, 5];
const SECONDS_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  durationMinutes: number;
  durationSeconds: number;
  onDurationChange: (minutes: number, seconds: number) => void;
  isRestRunning?: boolean;
  isRestPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancelRest?: () => void;
}

function TimerIcon({ size = 20, color = "white" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2 2" />
      <Path d="M9 3h6" />
      <Path d="M10 6h4" />
    </Svg>
  );
}

export function RestTimerModal({
  isOpen,
  onClose,
  enabled,
  onEnabledChange,
  durationMinutes,
  durationSeconds,
  onDurationChange,
  isRestRunning = false,
  isRestPaused = false,
  onPause,
  onResume,
}: RestTimerModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/60 items-center justify-center p-4">
        <Pressable onPress={() => {}} className="w-full max-w-[290px] rounded-3xl border border-white/10 bg-[#0E1224] p-6">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-2">
            <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
              <TimerIcon size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white">Rest Timer</Text>
              <Text className="text-xs text-white/60">Between sets</Text>
            </View>
          </View>

          {/* Controls row */}
          <View className="flex-row items-center justify-between mt-3 mb-4">
            {isRestRunning && (
              <Pressable
                onPress={() => (isRestPaused ? onResume?.() : onPause?.())}
                className="rounded-lg bg-white/10 px-3 py-1.5"
              >
                <Text className="text-xs font-semibold uppercase tracking-wider text-white">
                  {isRestPaused ? "Continue" : "Pause"}
                </Text>
              </Pressable>
            )}
            <View className="flex-1" />
            {/* Toggle switch */}
            <Pressable
              onPress={() => onEnabledChange(!enabled)}
              className={`w-14 h-8 rounded-full justify-center ${enabled ? "bg-[#e77d10]" : "bg-white/20"}`}
            >
              <View
                className={`h-6 w-6 rounded-full bg-white shadow-md ${enabled ? "ml-7" : "ml-1"}`}
              />
            </Pressable>
          </View>

          {/* Pickers */}
          <View className="flex-row justify-center gap-4">
            {/* Minutes */}
            <View className="items-center">
              <Text className={`mb-2 text-xs font-semibold uppercase tracking-wider ${enabled ? "text-white/50" : "text-white/20"}`}>
                min
              </Text>
              <ScrollView
                className={`h-[132px] w-20 rounded-lg ${enabled ? "bg-white/5" : "bg-white/5 opacity-40"}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={enabled}
              >
                {MINUTES_OPTIONS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={enabled ? () => onDurationChange(m, durationSeconds) : undefined}
                    className="h-11 items-center justify-center"
                  >
                    <Text
                      className={`text-sm ${durationMinutes === m ? "font-semibold text-white" : "text-white/50"}`}
                    >
                      {m} min
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Seconds */}
            <View className="items-center">
              <Text className={`mb-2 text-xs font-semibold uppercase tracking-wider ${enabled ? "text-white/50" : "text-white/20"}`}>
                sec
              </Text>
              <ScrollView
                className={`h-[132px] w-20 rounded-lg ${enabled ? "bg-white/5" : "bg-white/5 opacity-40"}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={enabled}
              >
                {SECONDS_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={enabled ? () => onDurationChange(durationMinutes, s) : undefined}
                    className="h-11 items-center justify-center"
                  >
                    <Text
                      className={`text-sm ${durationSeconds === s ? "font-semibold text-white" : "text-white/50"}`}
                    >
                      {s} sec
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
