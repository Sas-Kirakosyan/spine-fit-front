import { describe, it, expect, vi, afterEach } from "vitest";
import {
  planRetryDelay,
  isRetryableStatus,
  runPlanGenerationLoop,
  MAX_PLAN_ATTEMPTS,
  type AttemptOutcome,
} from "./planRetry";

afterEach(() => {
  vi.useRealTimers();
});

describe("planRetryDelay", () => {
  it("backs off exponentially and caps at 10s", () => {
    expect(planRetryDelay(1)).toBe(1000);
    expect(planRetryDelay(2)).toBe(2000);
    expect(planRetryDelay(3)).toBe(4000);
    expect(planRetryDelay(4)).toBe(8000);
    expect(planRetryDelay(5)).toBe(10000); // capped
    expect(planRetryDelay(10)).toBe(10000); // stays capped
  });
});

describe("isRetryableStatus", () => {
  it("treats only 503 (ai_unavailable) as retryable", () => {
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(502)).toBe(false);
    expect(isRetryableStatus(500)).toBe(false);
    expect(isRetryableStatus(429)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });
});

describe("runPlanGenerationLoop", () => {
  it("stops on first success without calling onGiveUp", async () => {
    const attempt = vi.fn(async (): Promise<AttemptOutcome> => "success");
    const onGiveUp = vi.fn();
    await runPlanGenerationLoop({ attempt, isMounted: () => true, onGiveUp });
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it("calls onGiveUp on a terminal (giveUp) outcome and stops", async () => {
    const attempt = vi.fn(async (): Promise<AttemptOutcome> => "giveUp");
    const onGiveUp = vi.fn();
    await runPlanGenerationLoop({ attempt, isMounted: () => true, onGiveUp });
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it("retries on transient outcomes until success (with backoff)", async () => {
    vi.useFakeTimers();
    // Success on the 3rd attempt — the last one MAX_PLAN_ATTEMPTS allows.
    const outcomes: AttemptOutcome[] = ["retry", "retry", "success"];
    let i = 0;
    const attempt = vi.fn(async (): Promise<AttemptOutcome> => outcomes[i++]);
    const onGiveUp = vi.fn();

    const p = runPlanGenerationLoop({ attempt, isMounted: () => true, onGiveUp });
    await vi.runAllTimersAsync();
    await p;

    expect(attempt).toHaveBeenCalledTimes(3);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it("gives up after MAX_PLAN_ATTEMPTS consecutive retry outcomes", async () => {
    vi.useFakeTimers();
    const attempt = vi.fn(async (): Promise<AttemptOutcome> => "retry");
    const onGiveUp = vi.fn();

    const p = runPlanGenerationLoop({ attempt, isMounted: () => true, onGiveUp });
    await vi.runAllTimersAsync();
    await p;

    expect(attempt).toHaveBeenCalledTimes(MAX_PLAN_ATTEMPTS);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it("stops cleanly once unmounted mid-retry (no onGiveUp, no infinite loop)", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const attempt = vi.fn(async (): Promise<AttemptOutcome> => {
      attempts += 1;
      return "retry";
    });
    // Becomes false after the 2nd attempt → the loop must exit without giving up.
    const onGiveUp = vi.fn();

    const p = runPlanGenerationLoop({
      attempt,
      isMounted: () => attempts < 2,
      onGiveUp,
    });
    await vi.runAllTimersAsync();
    await p;

    expect(attempts).toBe(2);
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
