// Static image registry for React Native (Metro requires static require() calls)
// Maps URI paths (as returned by getExerciseImageUrl) to bundled assets

type ImageSource = number;

export const exerciseSmImages: Record<string, ImageSource> = {
  "/exercisesSm/assisted-dips.webp": require("../../../../packages/shared/public/exercisesSm/assisted-dips.webp"),
  "/exercisesSm/assisted-pull-up.webp": require("../../../../packages/shared/public/exercisesSm/assisted-pull-up.webp"),
  "/exercisesSm/back-hyperextension.webp": require("../../../../packages/shared/public/exercisesSm/back-hyperextension.webp"),
  "/exercisesSm/belt-squats.webp": require("../../../../packages/shared/public/exercisesSm/belt-squats.webp"),
  "/exercisesSm/bench-or-machine-hip-thrust.webp": require("../../../../packages/shared/public/exercisesSm/bench-or-machine-hip-thrust.webp"),
  "/exercisesSm/bird-dog-bench-or-stability-ball.webp": require("../../../../packages/shared/public/exercisesSm/bird-dog-bench-or-stability-ball.webp"),
  "/exercisesSm/bodyweightlight-dumbbell-bulgarian-split-squats.webp": require("../../../../packages/shared/public/exercisesSm/bodyweightlight-dumbbell-bulgarian-split-squats.webp"),
  "/exercisesSm/cable-face-pull-rope-face-pull.webp": require("../../../../packages/shared/public/exercisesSm/cable-face-pull-rope-face-pull.webp"),
  "/exercisesSm/cable-kickbacks.webp": require("../../../../packages/shared/public/exercisesSm/cable-kickbacks.webp"),
  "/exercisesSm/cable-knee-drive.webp": require("../../../../packages/shared/public/exercisesSm/cable-knee-drive.webp"),
  "/exercisesSm/cable-tricep-pushdown.webp": require("../../../../packages/shared/public/exercisesSm/cable-tricep-pushdown.webp"),
  "/exercisesSm/chest-fly.webp": require("../../../../packages/shared/public/exercisesSm/chest-fly.webp"),
  "/exercisesSm/chin-up.webp": require("../../../../packages/shared/public/exercisesSm/chin-up.webp"),
  "/exercisesSm/deadlift.webp": require("../../../../packages/shared/public/exercisesSm/deadlift.webp"),
  "/exercisesSm/dumbbell-bicep-curls.webp": require("../../../../packages/shared/public/exercisesSm/dumbbell-bicep-curls.webp"),
  "/exercisesSm/dumbbell-lateral-raises.webp": require("../../../../packages/shared/public/exercisesSm/dumbbell-lateral-raises.webp"),
  "/exercisesSm/dumbbell-tricep-kickbacks.webp": require("../../../../packages/shared/public/exercisesSm/dumbbell-tricep-kickbacks.webp"),
  "/exercisesSm/floor-crunches.webp": require("../../../../packages/shared/public/exercisesSm/floor-crunches.webp"),
  "/exercisesSm/french-bench-press-ez-bar-skullcrusher.webp": require("../../../../packages/shared/public/exercisesSm/french-bench-press-ez-bar-skullcrusher.webp"),
  "/exercisesSm/glute-bridge-machine.webp": require("../../../../packages/shared/public/exercisesSm/glute-bridge-machine.webp"),
  "/exercisesSm/goblet-squat.webp": require("../../../../packages/shared/public/exercisesSm/goblet-squat.webp"),
  "/exercisesSm/hanging-leg-raises-bent-knee-or-single-leg.webp": require("../../../../packages/shared/public/exercisesSm/hanging-leg-raises-bent-knee-or-single-leg.webp"),
  "/exercisesSm/incline-dumbbell-press.webp": require("../../../../packages/shared/public/exercisesSm/incline-dumbbell-press.webp"),
  "/exercisesSm/incline-leg-raises.webp": require("../../../../packages/shared/public/exercisesSm/incline-leg-raises.webp"),
  "/exercisesSm/lat-pulldown-neutral-grip.webp": require("../../../../packages/shared/public/exercisesSm/lat-pulldown-neutral-grip.webp"),
  "/exercisesSm/lat-pulldown-wide-grip.webp": require("../../../../packages/shared/public/exercisesSm/lat-pulldown-wide-grip.webp"),
  "/exercisesSm/leg-extension.webp": require("../../../../packages/shared/public/exercisesSm/leg-extension.webp"),
  "/exercisesSm/leg-press.webp": require("../../../../packages/shared/public/exercisesSm/leg-press.webp"),
  "/exercisesSm/lying-leg-curl.webp": require("../../../../packages/shared/public/exercisesSm/lying-leg-curl.webp"),
  "/exercisesSm/machine-chest-press.webp": require("../../../../packages/shared/public/exercisesSm/machine-chest-press.webp"),
  "/exercisesSm/pull-up.webp": require("../../../../packages/shared/public/exercisesSm/pull-up.webp"),
  "/exercisesSm/push-ups.webp": require("../../../../packages/shared/public/exercisesSm/push-ups.webp"),
  "/exercisesSm/reverse-pec-deck-rear-delt-fly.webp": require("../../../../packages/shared/public/exercisesSm/reverse-pec-deck-rear-delt-fly.webp"),
  "/exercisesSm/seated-cable-row.webp": require("../../../../packages/shared/public/exercisesSm/seated-cable-row.webp"),
  "/exercisesSm/seated-dumbbell-shoulder-press.webp": require("../../../../packages/shared/public/exercisesSm/seated-dumbbell-shoulder-press.webp"),
  "/exercisesSm/seated-hip-abduction.webp": require("../../../../packages/shared/public/exercisesSm/seated-hip-abduction.webp"),
  "/exercisesSm/single-leg-glute-bridge.webp": require("../../../../packages/shared/public/exercisesSm/single-leg-glute-bridge.webp"),
  "/exercisesSm/single-leg-romanian-deadlift.webp": require("../../../../packages/shared/public/exercisesSm/single-leg-romanian-deadlift.webp"),
  "/exercisesSm/straight-arm-pulldown.webp": require("../../../../packages/shared/public/exercisesSm/straight-arm-pulldown.webp"),
};

export const quizImages: Record<string, ImageSource> = {
  "/quiz/8-15.png": require("../../../../packages/shared/public/quiz/8-15.png"),
  "/quiz/16-22.png": require("../../../../packages/shared/public/quiz/16-22.png"),
  "/quiz/23-30.png": require("../../../../packages/shared/public/quiz/23-30.png"),
  "/quiz/30-plus.png": require("../../../../packages/shared/public/quiz/30-plus.png"),
  "/quiz/female-18-24.png": require("../../../../packages/shared/public/quiz/female-18-24.png"),
  "/quiz/female-25-31.png": require("../../../../packages/shared/public/quiz/female-25-31.png"),
  "/quiz/female-32-38.png": require("../../../../packages/shared/public/quiz/female-32-38.png"),
  "/quiz/female-38-plus.png": require("../../../../packages/shared/public/quiz/female-38-plus.png"),
};

export const allImages: Record<string, ImageSource> = {
  ...exerciseSmImages,
  ...quizImages,
};

export function getLocalImageSource(uri: string): ImageSource | null {
  return allImages[uri] ?? null;
}
