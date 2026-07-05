import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../theme";

const STEP_DURATION_MS = 2400;
const FINAL_CHECKMARK_DWELL_MS = 500;
const STEP_IDS = [1, 2, 3, 4, 5] as const;
type StepId = (typeof STEP_IDS)[number];
type StepStatus = "pending" | "active" | "done";

export type PlanGeneratingLoaderProps = {
  apiPhase: "pending" | "success";
  onAllStepsComplete: () => void;
  stepLabelPrefix?: string;
};

export function PlanGeneratingLoader({
  apiPhase,
  onAllStepsComplete,
  stepLabelPrefix = "quiz.nav.generating",
}: PlanGeneratingLoaderProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [allDone, setAllDone] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentStep < 5) {
      const timer = setTimeout(() => {
        setCurrentStep((s) => (s + 1) as StepId);
      }, STEP_DURATION_MS);
      return () => clearTimeout(timer);
    }
    if (!allDone && apiPhase === "success") {
      setAllDone(true);
      return;
    }
    if (allDone) {
      const timer = setTimeout(() => {
        if (mountedRef.current) onAllStepsComplete();
      }, FINAL_CHECKMARK_DWELL_MS);
      return () => clearTimeout(timer);
    }
    return;
  }, [currentStep, apiPhase, allDone, onAllStepsComplete]);

  const statusOf = (id: StepId): StepStatus => {
    if (allDone) return "done";
    if (id < currentStep) return "done";
    if (id > currentStep) return "pending";
    return "active";
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#080A14] px-6">
      <View className="w-full max-w-[320px] gap-5">
        {STEP_IDS.map((id) => (
          <StepRow
            key={id}
            label={t(`${stepLabelPrefix}.step${id}`)}
            status={statusOf(id)}
          />
        ))}
      </View>
    </View>
  );
}

function StepRow({ label, status }: { label: string; status: StepStatus }) {
  const textClass =
    status === "pending"
      ? "text-white/40"
      : status === "active"
        ? "text-white"
        : "text-white/80";

  return (
    <View className="flex-row items-center gap-2">
      <Text className={`text-base font-medium ${textClass}`}>{label}</Text>
      {status === "active" && <PulsingDots />}
      {status === "done" && <CheckMark />}
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "white",
        opacity,
      }}
    />
  );
}

export function PulsingDots() {
  return (
    <View className="flex-row items-center" style={{ gap: 3 }}>
      {[0, 150, 300].map((delay) => (
        <PulsingDot key={delay} delay={delay} />
      ))}
    </View>
  );
}

function CheckMark() {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.main}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12 L10 17 L19 7" />
    </Svg>
  );
}
