import type { TFunction } from "i18next";

const painLocationKeys: Record<string, string> = {
  "Lower Back (L4-L5/S1 area)": "profilePage.locationLowerBack",
  "Sciatica (Pain radiating down leg)": "profilePage.locationSciatica",
  "Glute / Deep Hip discomfort": "profilePage.locationGluteHip",
  "Calf or Foot (Numbness/Tingling)": "profilePage.locationCalfFoot",
};

const painTriggerKeys: Record<string, string> = {
  "Bending forward (e.g., reaching for the floor)":
    "profilePage.triggerBending",
  "Arching backward (e.g., reaching overhead)": "profilePage.triggerArching",
  "Lifting or carrying heavy objects": "profilePage.triggerLifting",
  "Sitting for longer than 20–30 minutes": "profilePage.triggerSitting",
  "Impact movements (Running, Jumping)": "profilePage.triggerImpact",
  "Rotating or twisting the torso": "profilePage.triggerRotating",
  "Straining (Heavy bracing/holding breath)": "profilePage.triggerStraining",
};

export function getPainLocationLabel(t: TFunction, value: string): string {
  const key = painLocationKeys[value];
  if (!key) return value;
  return t(key, value);
}

export function getPainTriggerLabel(t: TFunction, value: string): string {
  const key = painTriggerKeys[value];
  if (!key) return value;
  return t(key, value);
}
