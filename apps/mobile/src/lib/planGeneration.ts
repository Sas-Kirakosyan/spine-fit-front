import type { GeneratedPlan } from "@spinefit/shared";
import { isRetryableStatus } from "@spinefit/shared";
import { env } from "../config/env";
import { savePlan } from "./planService";
import type { StoredQuizData } from "./quizStorage";

export type PlanGenerationResult =
  | { ok: true; plan: GeneratedPlan }
  | { ok: false; error: string; retryable: boolean };

// React Native's fetch has no built-in timeout: when the backend host is
// unreachable (e.g. a firewall silently dropping packets), a request can hang
// for minutes. So reachability is checked first with a cheap short probe, and
// only then is the heavy generation request sent — with a generous timeout,
// because Gemini can legitimately take tens of seconds (model fallbacks,
// retries on the backend side). Aborting a slow-but-working generation loses
// the plan the backend already produced.
const PROBE_TIMEOUT_MS = 3_000;
const RESPONSE_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function isBackendReachable(): Promise<boolean> {
  try {
    // Any HTTP response proves the host is reachable; only a network error
    // or timeout means it is not.
    await fetchWithTimeout(
      `${env.API_URL}/health`,
      { method: "GET" },
      PROBE_TIMEOUT_MS
    );
    return true;
  } catch {
    return false;
  }
}

export async function generatePlanFromQuiz(
  quizData: StoredQuizData
): Promise<PlanGenerationResult> {
  // Fail fast (≈3s instead of minutes) when the dev server is off, the LAN IP
  // is wrong, or a firewall drops packets. Retryable: the retry loop re-probes.
  if (!(await isBackendReachable())) {
    return { ok: false, error: "backend_unreachable", retryable: true };
  }

  try {
    const response = await fetchWithTimeout(
      `${env.API_URL}/api/quiz`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      },
      RESPONSE_TIMEOUT_MS
    );

    if (!response.ok) {
      // 503 (ai_unavailable) is transient → retryable; 502/500/4xx are terminal.
      return {
        ok: false,
        error: `Server error: ${response.status}`,
        retryable: isRetryableStatus(response.status),
      };
    }

    const result = (await response.json()) as {
      success: boolean;
      plan: GeneratedPlan;
    };

    if (!result.success || !result.plan) {
      return { ok: false, error: "invalid_plan_payload", retryable: false };
    }

    await savePlan(result.plan);
    return { ok: true, plan: result.plan };
  } catch (err) {
    // Network error, timeout, or backend died mid-request → transient.
    console.error("Failed to generate plan:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
      retryable: true,
    };
  }
}