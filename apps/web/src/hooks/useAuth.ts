import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User; session: Session }
  | { status: "unauthenticated" };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error?.message?.toLowerCase().includes("refresh token")) {
        await supabase.auth.signOut().catch(() => {});
        if (!mounted) return;
        setState({ status: "unauthenticated" });
        return;
      }
      if (!mounted) return;
      setState(
        data.session
          ? { status: "authenticated", user: data.session.user, session: data.session }
          : { status: "unauthenticated" }
      );
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: "authenticated", user: session.user, session }
          : { status: "unauthenticated" }
      );
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
