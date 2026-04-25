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
    .replace(/[()]/g, "")
    .replace(/\//g, "")
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

export const getExerciseVideoUrl = (
  exercise: Pick<Exercise, "id" | "name" | "video_url">
): string => {
  if (!exercise.video_url) return "";
  if (/^https?:\/\//.test(exercise.video_url)) {
    try {
      const host = new URL(exercise.video_url).host;
      if (SUPABASE_HOST && host === SUPABASE_HOST) return exercise.video_url;
    } catch {
      // fall through
    }
  }
  return assetUrl(`Video/Exercises/${nameToKebab(exercise.name)}.mp4`);
};
