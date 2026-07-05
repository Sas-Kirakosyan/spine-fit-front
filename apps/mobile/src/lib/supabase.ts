import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      // There is no browser URL to inspect in React Native; OAuth and
      // password-recovery links arrive as deep links and are handled
      // explicitly in authService / ResetPasswordScreen.
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  }
);

// Supabase recommends refreshing tokens only while the app is foregrounded.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
