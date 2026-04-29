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

export const OAUTH_IN_PROGRESS_KEY = "oauthInProgress";

export async function signInWithGoogle(): Promise<OAuthResult> {
  // Marker read by App.tsx after the OAuth redirect lands the user back on "/".
  // Without it the post-auth handler can't tell an OAuth completion apart from
  // a normal app load with an existing session.
  localStorage.setItem(OAUTH_IN_PROGRESS_KEY, "google");

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
