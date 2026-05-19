import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

export type OAuthResult = { ok: true } | { ok: false; error: AuthError };

export type OAuthIntent = "login" | "register";

export const OAUTH_IN_PROGRESS_KEY = "oauthInProgress";

// Set by the post-OAuth handler in App.tsx when a "login" attempt turned out to
// create a brand-new account (i.e. the user never registered). The Login page
// reads it on mount to show the "no account" error.
export const GOOGLE_LOGIN_NO_ACCOUNT_KEY = "googleLoginNoAccount";

// Set by the post-OAuth handler in App.tsx when a "register" attempt picked a
// Google account that was already registered. The Login page reads it on mount
// to show the "already registered" error.
export const GOOGLE_REGISTER_EXISTS_KEY = "googleRegisterExists";

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

export async function signInWithGoogle(
  intent: OAuthIntent = "register"
): Promise<OAuthResult> {
  // Marker read by App.tsx after the OAuth redirect lands the user back on "/".
  // Without it the post-auth handler can't tell an OAuth completion apart from
  // a normal app load with an existing session. The value also carries the
  // intent so a "login" that created a fresh account can be rejected.
  localStorage.setItem(OAUTH_IN_PROGRESS_KEY, intent);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    localStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
    return { ok: false, error };
  }
  if (!data?.url) {
    localStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
    return {
      ok: false,
      error: {
        message: "Supabase did not return an OAuth URL",
        name: "OAuthError",
      } as AuthError,
    };
  }

  window.location.assign(data.url);
  return { ok: true };
}
