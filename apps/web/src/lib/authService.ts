import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type SignUpResult =
  | {
      ok: true;
      user: User | null;
      needsEmailConfirmation: boolean;
    }
  | {
      ok: false;
      error: string;
      isUserExists: boolean;
    };

function isUserExistsMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("user already") ||
    lower.includes("already exists")
  );
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return {
      ok: false,
      error: error.message,
      isUserExists: isUserExistsMessage(error.message),
    };
  }

  return {
    ok: true,
    user: data.user,
    needsEmailConfirmation: data.user !== null && data.session === null,
  };
}