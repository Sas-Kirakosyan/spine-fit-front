// Shared retry policy for AI plan generation across all entry points
// (first-time generation, the workout-page "Generate" button, and regenerate
// from My Plan / Profile).
//
// Two failure modes, distinguished by the backend:
//   - 503 / code "ai_unavailable" → the AI service was overloaded/unreachable.
//     Transient: keep polling until it recovers (variant 2).
//   - 502 / code "ai_generation_failed" (and any other non-ok status) → the
//     model returned unusable content. Terminal: stop and surface the failure
//     (variant 1 — e.g. drop the user to the workout page).
// A thrown fetch (backend unreachable) is also transient → retry.

export type AttemptOutcome = "success" | "retry" | "giveUp";

export const RETRY_BASE_MS = 1000;
export const RETRY_MAX_MS = 10_000;

/** Exponential backoff (1s, 2s, 4s, … capped at 10s) for the nth attempt (1-based). */
export function planRetryDelay(attempt: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
}

/** Only a 503 (ai_unavailable) is worth retrying; every other non-ok status is terminal. */
export function isRetryableStatus(status: number): boolean {
  return status === 503;
}

/**
 * Drive an attempt callback until it succeeds or gives up, backing off between
 * retries. `attempt` owns its own side effects (fetch, save, set loader phase)
 * and returns the outcome; the loop only sequences/backs-off. Loops forever on
 * "retry" while `isMounted()` holds, so the caller must guard unmount/navigation.
 */
export async function runPlanGenerationLoop(opts: {
  attempt: () => Promise<AttemptOutcome>;
  isMounted: () => boolean;
  onGiveUp: () => void;
}): Promise<void> {
  let n = 0;
  while (opts.isMounted()) {
    const outcome = await opts.attempt();
    if (!opts.isMounted()) return;
    if (outcome === "success") return;
    if (outcome === "giveUp") {
      opts.onGiveUp();
      return;
    }
    n += 1;
    await new Promise<void>((resolve) => setTimeout(resolve, planRetryDelay(n)));
  }
}
