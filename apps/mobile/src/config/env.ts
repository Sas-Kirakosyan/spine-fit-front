// EXPO_PUBLIC_* values are inlined into the bundle at build time by
// babel-preset-expo; changing apps/mobile/.env requires restarting the dev
// server with `expo start -c`.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Expected EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/mobile/.env"
  );
}

export const env = {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
};
