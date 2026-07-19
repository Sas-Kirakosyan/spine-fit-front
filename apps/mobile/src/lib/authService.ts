import type { AuthError, User } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { env } from "../config/env";

export function isUserExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("user already") ||
    lower.includes("already exists")
  );
}

export type SignUpResult =
  | {
      ok: true;
      user: User | null;
      requiresEmailConfirmation: boolean;
    }
  | {
      ok: false;
      error: AuthError;
      userExists: boolean;
    };

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return {
      ok: false,
      error,
      userExists: isUserExistsError(error.message),
    };
  }

  return {
    ok: true,
    user: data.user,
    requiresEmailConfirmation: !data.session,
  };
}

export type SignInResult =
  | { ok: true; user: User }
  | { ok: false; error: AuthError };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, error };
  return { ok: true, user: data.user };
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; error: AuthError };

export async function sendPasswordResetEmail(
  email: string,
  redirectTo: string
): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function updateUserPassword(
  password: string
): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error };
  return { ok: true };
}

export type OAuthIntent = "login" | "register";

/**
 * Supabase's OAuth sign-in silently creates an account when none exists, so we
 * can't tell "signed in" apart from "just signed up" from the result alone.
 * A brand-new OAuth user is created and signed in within the same round-trip,
 * so `created_at` and `last_sign_in_at` are within a few seconds of each other.
 * An existing user signing in again has `created_at` far in the past.
 */
export function isFreshlyCreatedUser(user: User): boolean {
  const created = new Date(user.created_at).getTime();
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).getTime()
    : created;
  return Math.abs(lastSignIn - created) < 10_000;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}

/**
 * Deletes the currently-authenticated user from Supabase via the `delete-self`
 * Edge Function. The function reads the caller's JWT, re-derives their uid
 * server-side, and uses the service role to delete them — the client never
 * sees the service role key, and the caller can only ever delete themselves.
 *
 * Used to reverse the silent account creation that Supabase performs during
 * `signInWithOAuth` when no account exists for the Google identity. Network or
 * server errors are swallowed and return false — the caller still shows the
 * "no account" error even if cleanup failed.
 */
export async function deleteCurrentUserViaEdgeFunction(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return false;

    const res = await fetch(`${env.SUPABASE_URL}/functions/v1/delete-self`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type GoogleSignInResult =
  | { ok: true; user: User }
  | { ok: false; reason: "cancelled" }
  | { ok: false; reason: "noAccount" }
  | { ok: false; reason: "alreadyRegistered" }
  | { ok: false; reason: "error"; message: string };

const AUTH_CALLBACK_PATH = "auth-callback";

/**
 * On Android (notably in Expo Go) openAuthSessionAsync often resolves with
 * `{ type: "dismiss" }` when the redirect deep link brings the app back to
 * the foreground, while the callback URL arrives as a Linking "url" event.
 * Subscribe before opening the browser so the caller can race both.
 */
function listenForAuthCallback(): {
  promise: Promise<string>;
  remove: () => void;
} {
  let remove: () => void = () => {};
  const promise = new Promise<string>((resolve) => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url.includes(AUTH_CALLBACK_PATH)) resolve(url);
    });
    remove = () => sub.remove();
  });
  return { promise, remove };
}

function delay(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/**
 * Native Google sign-in. Unlike the web flow (full-page redirect handled later
 * in App.tsx), the whole round-trip happens inside this call: an in-app
 * browser session returns the PKCE code via deep link, so both intents are
 * resolved inline without localStorage markers.
 *
 * The redirect URL produced by Linking.createURL must be whitelisted in
 * Supabase Auth → URL Configuration → Redirect URLs, otherwise Supabase
 * silently falls back to the project Site URL (the web app) and the browser
 * never returns to the app.
 */
export async function signInWithGoogle(
  intent: OAuthIntent
): Promise<GoogleSignInResult> {
  const redirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
  if (__DEV__) {
    // Copy this exact URL into the Supabase redirect allow-list if the
    // wildcard entries are not accepted.
    console.log("[google-oauth] redirectTo:", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    return {
      ok: false,
      reason: "error",
      message: error?.message ?? "Supabase did not return an OAuth URL",
    };
  }

  // Subscribe BEFORE opening the browser: on Android the "url" event can
  // fire before openAuthSessionAsync settles.
  const listener = listenForAuthCallback();
  let callbackUrl: string | null = null;
  try {
    const result = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectTo),
      listener.promise.then((url) => ({ type: "success" as const, url })),
    ]);
    if (__DEV__) console.log("[google-oauth] browser result:", result.type);

    if (result.type === "success") {
      callbackUrl = result.url;
    } else {
      // "dismiss"/"cancel" may race the deep link on Android; give the
      // Linking event a short grace period before treating it as a cancel.
      callbackUrl = await Promise.race([listener.promise, delay(2000)]);
    }
  } finally {
    listener.remove();
    if (Platform.OS === "ios") {
      // Close the auth sheet if the deep link won while it was still open.
      try {
        WebBrowser.dismissAuthSession();
      } catch {}
    } else {
      // Release the Custom Tabs connection on Android.
      await WebBrowser.coolDownAsync().catch(() => {});
    }
  }

  if (!callbackUrl) {
    return { ok: false, reason: "cancelled" };
  }
  if (__DEV__) console.log("[google-oauth] callback url:", callbackUrl);

  // Linking.parse handles exp://host/--/path?query reliably, unlike WHATWG
  // URL parsing of non-http schemes.
  const { queryParams } = Linking.parse(callbackUrl);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (!code) {
    // Supabase bounces provider errors back as error/error_description params.
    const description =
      (typeof queryParams?.error_description === "string" &&
        queryParams.error_description) ||
      (typeof queryParams?.error === "string" && queryParams.error) ||
      null;
    return {
      ok: false,
      reason: "error",
      message: description ?? "OAuth callback did not return a code",
    };
  }

  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !sessionData.session) {
    return {
      ok: false,
      reason: "error",
      message: exchangeError?.message ?? "Failed to create a session",
    };
  }

  const user = sessionData.session.user;

  if (intent === "login" && isFreshlyCreatedUser(user)) {
    await deleteCurrentUserViaEdgeFunction();
    await signOut();
    return { ok: false, reason: "noAccount" };
  }
  if (intent === "register" && !isFreshlyCreatedUser(user)) {
    await signOut();
    return { ok: false, reason: "alreadyRegistered" };
  }

  return { ok: true, user };
}
