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
