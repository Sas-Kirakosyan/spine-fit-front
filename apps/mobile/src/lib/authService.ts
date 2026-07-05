import type { AuthError, User } from "@supabase/supabase-js";
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

/**
 * Native Google sign-in. Unlike the web flow (full-page redirect handled later
 * in App.tsx), the whole round-trip happens inside this call: an in-app
 * browser session returns the PKCE code via deep link, so both intents are
 * resolved inline without localStorage markers.
 *
 * The redirect URL produced by Linking.createURL must be whitelisted in
 * Supabase Auth → URL Configuration → Redirect URLs.
 */
export async function signInWithGoogle(
  intent: OAuthIntent
): Promise<GoogleSignInResult> {
  const redirectTo = Linking.createURL("auth-callback");

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

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    return { ok: false, reason: "cancelled" };
  }

  const callbackUrl = new URL(result.url);
  const code = callbackUrl.searchParams.get("code");
  if (!code) {
    const description =
      callbackUrl.searchParams.get("error_description") ??
      callbackUrl.searchParams.get("error");
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
