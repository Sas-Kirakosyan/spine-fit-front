// Shared retry policy for AI plan generation across all entry points
// (first-time generation, the workout-page "Generate" button, and regenerate
// from My Plan / Profile).
//
// Two failure modes, distinguished by the backend:
//   - 503 / code "ai_unavailable" → the AI service was overloaded/unreachable.
//     Transient: retry up to MAX_PLAN_ATTEMPTS total attempts, then treat as
//     terminal (variant 2).
//   - 502 / code "ai_generation_failed" (and any other non-ok status) → the
//     model returned unusable content. Terminal: stop and surface the failure
//     (variant 1 — e.g. drop the user to the workout page).
// A thrown fetch (backend unreachable) is also transient → retry, under the
// same attempt cap.

export type AttemptOutcome = "success" | "retry" | "giveUp";

export const RETRY_BASE_MS = 1000;
export const RETRY_MAX_MS = 10_000;
export const MAX_PLAN_ATTEMPTS = 3;

/** Exponential backoff (1s, 2s, 4s, … capped at 10s) for the nth attempt (1-based). */
export function planRetryDelay(attempt: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
}

/** Only a 503 (ai_unavailable) is worth retrying; every other non-ok status is terminal. */
export function isRetryableStatus(status: number): boolean {
  return status === 503;
}

// TODO(2026-07-20, temporary diagnostics): `describeError` / `describeHttpError`
// exist to surface raw plan-generation failures in the UI toast while we chase
// an iOS-only regeneration bug. They leak backend error bodies to end users, so
// remove them — and the `detail` plumbing through onRegenerateFailed /
// onPlanGenerationFailed / onSyncError — once that bug is understood, or gate
// them behind a debug flag if they earn their keep. Revisit by ~2026-09.

/** Message from a thrown value (fetch rejection, JSON parse error, …). */
export function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Compact description of a failed response — status plus a body snippet — so a
 * failure can be diagnosed from the on-screen toast alone, without a devtools
 * console (the usual case on iOS). Truncated to keep the toast readable.
 */
export async function describeHttpError(response: Response): Promise<string> {
  let body = "";
  try {
    body = (await response.text()).slice(0, 200);
  } catch {
    // Body unreadable/already consumed — the status alone still identifies it.
  }
  return body ? `HTTP ${response.status}: ${body}` : `HTTP ${response.status}`;
}

/**
 * Drive an attempt callback until it succeeds or gives up, backing off between
 * retries. `attempt` owns its own side effects (fetch, save, set loader phase)
 * and returns the outcome; the loop only sequences/backs-off. Retries on
 * "retry" up to MAX_PLAN_ATTEMPTS total attempts (network-error retries count
 * toward the same cap), then calls `onGiveUp` — same terminal path as a
 * "giveUp" outcome. The caller must still guard unmount/navigation via
 * `isMounted()`.
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
    if (n >= MAX_PLAN_ATTEMPTS) {
      opts.onGiveUp();
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, planRetryDelay(n)));
  }
}
