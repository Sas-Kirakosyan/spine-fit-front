import type { Exercise } from "@/types/exercise";

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? "SpineFit Media";
const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}`;

export const assetUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.replace(/^\/+/, "");
  return `${BASE}/${clean.split("/").map(encodeURIComponent).join("/")}`;
};

const nameToKebab = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const logoUrl = (file = "logo.png"): string =>
  assetUrl(`Photo/Logo/${file}`);

const SUPABASE_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).host;
  } catch {
    return "";
  }
})();

// Override map for cases where the storage filename doesn't match nameToKebab(exercise.name).
// Key is the kebab-cased exercise name; value is the actual file stem in storage.
const VIDEO_NAME_OVERRIDES: Record<string, string> = {
  "bodyweight-box-squat": "bodyweight-box-squat-2",
  "cable-face-pull-rope-face-pull": "cable-face-pull",
  "cable-tricep-pushdown": "cable-tricep-pushdown-machine",
  "goblet-squat-heels-elevated": "goblet-squat-heels-elevated-2",
  "incline-dumbbell-press": "incline-dumbbell-press-form",
  "vertical-leg-raise-captains-chair-bent-knee":
    "vertical-leg-raise-captain-s-chair-bent-knee",
};

export const getExerciseVideoUrl = (
  exercise: Pick<Exercise, "id" | "name" | "video_url">
): string => {
  if (exercise.video_url && /^https?:\/\//.test(exercise.video_url)) {
    try {
      const host = new URL(exercise.video_url).host;
      if (SUPABASE_HOST && host === SUPABASE_HOST) return exercise.video_url;
    } catch {
      // fall through
    }
  }
  if (!exercise.name) return "";
  const stem = nameToKebab(exercise.name);
  const fileName = VIDEO_NAME_OVERRIDES[stem] ?? stem;
  return assetUrl(`Video/Exercises/${fileName}.mp4`);
};
