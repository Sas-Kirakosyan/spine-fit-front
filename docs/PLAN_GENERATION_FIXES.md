# Plan Generation — Architecture & Current State

**Last Updated:** 2026-05-10
**Status:** ✅ LLM-based generation active

---

## How Plan Generation Works Now

Plan generation is fully handled by **Google Gemini AI** (no local algorithms).

### Flow

```
Quiz answers (ParsedQuizData)
    ↓
exerciseFilter.ts  ← prepareExercisesForPrompt(): drops exercises that conflict
                     with the user's pain status, experience, and pain triggers
    ↓
promptBuilder.ts   ← buildSystemInstruction() picks one of three system prompts;
                     buildUserPrompt() builds the user-message payload (profile +
                     filtered exercise table + per-request constraints)
    ↓
Gemini API         ← returns structured JSON plan (validated against PLAN_SCHEMA)
    ↓
geminiService.ts   ← resolves exercise IDs → full objects, computes missing
                     muscle groups + back-friendly alternatives
    ↓
GeneratedPlanResult
```

### Key Files

| File                                         | Role                                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `apps/backend/src/services/geminiService.ts` | Main entry point — calls Gemini, parses response, builds final plan |
| `apps/backend/src/utils/exerciseFilter.ts`   | Filters exercise list before sending to AI                          |
| `apps/backend/src/utils/promptBuilder.ts`    | Builds system instruction and user prompt                           |
| `apps/backend/src/utils/splitUtils.ts`       | Maps training split → split type identifier and target muscles      |
| `apps/backend/src/schemas/planSchema.ts`     | Gemini response schema (`PLAN_SCHEMA`)                              |
| `apps/backend/src/types.ts`                  | `ParsedQuizData` shape — includes `goal` (effective) and `originalGoal?` (user selection before any override) |
| `apps/backend/src/schemas/quizSettingsSchema.ts` | Zod schema for the `/regenerate` endpoint — validates `originalGoal` passthrough |

### Models

- **Primary:** `gemini-2.5-flash`
- **Fallback:** `gemini-3.1-flash-lite-preview` (used automatically if primary fails)

---

## Exercise Filtering — `exerciseFilter.ts`

`prepareExercisesForPrompt(exercises, painStatus?, context?)` strips exercises the user must not see, then projects them down to the lean `PromptExercise` shape that the model receives in the user prompt.

### Drop rules (applied in this order)

1. **Active Symptoms gate** — if `painStatus === "Active Symptoms"`:
   - drop any exercise that is not `is_back_friendly`.
   - drop any exercise with a `back_issue_restrictions` entry whose `restriction_level` is `medium` or `high`.
2. **Experience-based difficulty filter** — uses `EXCLUDED_DIFFICULTIES`:
   - `Beginner` and `Intermediate` → drop `advanced` exercises.
   - `Advanced` → no exclusions.
3. **Pain-trigger high-load filter** — if any `painTriggers` value contains a `HIGH_LOAD_TRIGGERS` keyword (`"Weighted Squats or Deadlifts"`, `"Lifting objects from the floor"`), drop any exercise that has at least one `restriction_level === "high"` entry.

### Output shape (`PromptExercise`)

```ts
{ id, name, muscle_groups, equipment, difficulty, is_back_friendly,
  restrictions: { issue_type, restriction_level }[] }
```

The original `back_issue_restrictions` array is flattened to a minimal `{ issue_type, restriction_level }` list — the rest of the raw row is dropped to keep prompt tokens low.

---

## Prompt Building — `promptBuilder.ts`

### Dispatcher

`buildSystemInstruction(quiz)` chooses one of three system prompts based on `painStatus`:

| `painStatus` (lowercased prefix) | System prompt                          |
| -------------------------------- | -------------------------------------- |
| `active…`                        | `buildActivePrompt(duration, painLevel)` |
| `recovered…`                     | `buildRecoveredPrompt(duration, painLocation)` |
| anything else / undefined        | `buildHealthyPrompt(duration)` (default) |

### Goal override — `resolveEffectiveGoal(goal, painStatus?, originalGoal?)`

When `painStatus` starts with `"active"`, the user's goal is overridden to `ACTIVE_PAIN_GOAL = "Pain Recovery & Symptom Management"`. The original selection is passed as `originalGoal` so the AI prompt can display context (`"auto-set — original goal: \"...\""`) without embedding that string in stored settings.

`GeneratedPlanResult.settings` stores:
- `goal` — the effective goal label (clean, never contains embedded metadata)
- `originalGoal` — the user's quiz selection, present only when an active-symptoms override occurred

On regeneration the `originalGoal` field is carried through `quizSettingsSchema` and forwarded to `resolveEffectiveGoal` for the prompt. If `painStatus` is later changed away from Active Symptoms, `storedGoal` reverts to `originalGoal` automatically and `originalGoal` is cleared.

### Shared helpers

- **`exerciseCountForDuration(duration)`** — converts the duration string into a target exercise range used inside every prompt:

  | Duration phrase                    | Range  |
  | ---------------------------------- | ------ |
  | `under 30` / `<30`                 | 2–3    |
  | `30–45`                            | 4–5    |
  | `45–60`                            | 5–7    |
  | `30–60`                            | 4–7    |
  | `60–90`                            | 7–9    |
  | contains `90`                      | 8–12   |
  | numeric fallback ≤30 / ≤45 / ≤60 / ≤90 / >90 | 2–3 / 4–5 / 5–7 / 7–9 / 8–10 |
  | unparseable                        | 4–6    |

- **`formatExercisesAsTable(exercises)`** — emits a pipe-delimited table prefixed with `ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions`. Multi-value cells use `,` as inner separator; restrictions render as `issue_type:restriction_level,…` or `none`.
- **`hasLumbarOrSciaticInvolvement(painLocations)`** — returns true if any joined pain location matches `/lower back|l4|l5|s1|lumbar|sciatic/`. Used by the Recovered prompt to enable the L5-S1 protocol block.

### Prompt 1 — Healthy (`buildHealthyPrompt`)

For users with no current or past back pain. Trains for performance with spine-safe defaults.

Rules covered: `exerciseId`-only references, pre-approved-list trust, exercise count for duration, bodyweight weight=0, vertical+horizontal pull mandate, push mandate, lower-body compound + squat-confidence substitution, ≤2 exercises per movement pattern, no exercise repeated within a day, RPE 7–8 W1, NOTES field format `[progression] | [load rule]`, additional-notes priority, plan name, `weeks=4`, never hallucinate IDs.

### Prompt 2 — Recovered (`buildRecoveredPrompt`)

For users with past pain history but currently asymptomatic.

Same baseline as Healthy plus:

- **Core stability mandate** — every training day must include ≥1 core stability exercise from the list (or skip silently).
- **Recovered intensity** — RPE 6–7 W1, moderate load.
- **NOTES** adds a `[pain rule]` segment.
- **Lumbar/sciatic protocol block** is appended (rule 17, with subsequent rule numbers shifted by `ruleOffset`) only when `hasLumbarOrSciaticInvolvement(painLocations)` is true. The block enforces:
  - core priority list (cable knee drive → single-leg glute bridge → dead bug → bird dog → pallof press),
  - avoid seated machines unless no alternative (and limit to 1/day with a stand-and-walk note),
  - prioritize decompressive movements (cable knee drives, single-leg glute bridge, cable kickbacks),
  - prefer unilateral upper-body variations with a "brace free hand" note,
  - place core stabilization early in the session.

### Prompt 3 — Active Symptoms (`buildActivePrompt`)

For users currently in pain. Prioritizes pain-free movement and low fatigue.

Adds on top of the Recovered protocol:

- **Volume control tightened** — ≤1 exercise per movement pattern per session.
- **Active intensity** — RPE 5–6 W1, conservative load, 12–15 reps, short sets.
- **Pain-level guidance** — interpolated from `painLevel`:
  - `painLevel ≥ 7` → "RPE 4–5 max, 2 sets only, bodyweight or minimal load preferred", plus `"Consult your physician before increasing intensity."` in the pain rule.
  - `painLevel ≥ 4` → "stay at the lower bound; do not progress load until pain drops below 4".
- **Lumbar/sciatic protocol** is always active for symptomatic users (rule 19).
- **Hip adduction mandate (rule 20)** — at least one training day must include both `Seated Hip Adduction` and `Standing Cable Hip Adduction` if both exist in the filtered list; if only one exists, include that; if neither exists, skip silently.

### User Prompt — `buildUserPrompt(quiz, exercises)`

Produces the user message. Sections, in order:

1. Headline: `Create a structured ${quiz.workoutsPerWeek} training plan.`
2. **USER PROFILE** — effective goal (via `resolveEffectiveGoal(quiz.goal, quiz.painStatus, quiz.originalGoal)` — includes original-goal context when overridden by Active Symptoms), experience, training split, session duration, pain status (default `Healthy`), pain locations, pain level (default `0`), pain triggers, squat confidence (default `Confident`), preferred units, and `additionalNotes` if present.
3. Exercise variability hint — if `exerciseVariability` includes "high", instructs the model to rotate exercises across days; otherwise to keep movements consistent across weeks.
4. **SPLIT DAY STRUCTURE** — provided by `buildSplitDayGuidance` for Push/Pull/Legs, Upper/Lower, Full Body, or Bro Split. Empty for unrecognized splits.
5. **AVAILABLE EXERCISES** — `EXERCISE FORMAT` legend followed by the table from `formatExercisesAsTable`.
6. **ADDITIONAL CONSTRAINTS** — duration cap, exact day count parsed from `quiz.workoutsPerWeek` (digits only, default `3`), and `weight_unit` echo.

---

## Split Mapping — `splitUtils.ts`

### `mapSplitType(split)` → split key

Regex-based mapping from the human-readable split string to a stable identifier. Order matters — earlier patterns win.

| Pattern (case-insensitive)              | Resolved type                  |
| --------------------------------------- | ------------------------------ |
| `Full Body … A … B … C`                 | `FULL_BODY_ABC`                |
| `Full Body … A … B`                     | `FULL_BODY_AB`                 |
| `Full Body` (any other)                 | `FULL_BODY_4X`                 |
| `Upper … Lower … Alternating`           | `UPPER_LOWER_ALTERNATING`      |
| `Upper … Lower … Upper`                 | `UPPER_LOWER_UPPER`            |
| `Upper … Lower` (any other)             | `UPPER_LOWER_4X`               |
| `Push … Pull … Legs`                    | `PUSH_PULL_LEGS`               |
| `Bro Split`                             | `BRO_SPLIT`                    |
| no match                                | `FULL_BODY_ABC` (default)      |

### `SPLIT_TARGET_MUSCLES` — coverage table

Used by `geminiService.ts` after the model responds to compute `missingMuscleGroups` (target muscles minus muscles actually covered by the returned exercises).

| Split type                                    | Target muscles                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `FULL_BODY_ABC` / `FULL_BODY_AB` / `FULL_BODY_4X` | chest, lats, upper_back, quads, glutes, hamstrings                                                |
| `UPPER_LOWER_*`                               | chest, lats, upper_back, front_delts, rear_delts, triceps, biceps, quads, glutes, hamstrings           |
| `PUSH_PULL_LEGS`                              | chest, front_delts, triceps, lats, upper_back, rear_delts, biceps, quads, glutes, hamstrings           |
| `BRO_SPLIT`                                   | chest, lats, upper_back, front_delts, rear_delts, triceps, biceps, quads, glutes, hamstrings           |

---

## Post-Generation Validation — `geminiService.ts`

After Gemini responds:

1. **ID validation** — every returned `exerciseId` is checked against the local exercise map; unknown IDs are dropped with a warning (`⚠ N unknown exercise ID(s): […]`).
2. **Empty-day guard** — throws if any workout day ends up with 0 valid exercises after ID resolution.
3. **Missing muscle groups** — `targetMuscles` (from `SPLIT_TARGET_MUSCLES`) minus `coveredMuscles` (from the returned exercises). For each missing group, the service finds an unused exercise — preferring `is_back_friendly: true` — and adds it to `alternativeExercises`.

The final `GeneratedPlanResult` carries the resolved quiz settings (with `goal` and `originalGoal?` stored as separate clean fields — see Goal override section above), the resolved `splitType`, the `workoutDays[]`, `missingMuscleGroups`, and `alternativeExercises`.

---

## What Was Removed

The following no longer exist and should not be referenced:

- `volumeCalculator.ts` (backend) — sets/volume is now decided by the AI
- `planGenerator.ts` / `planGeneratorHelpers.ts` — local rule-based plan generation fully removed
- `splitScheduler.ts` (backend) — replaced by `splitUtils.ts` + the prompt's `SPLIT DAY STRUCTURE` section
- Manual exercise type requirements (push/pull/leg/core slots) — AI handles structure
- Console log warnings like `[FULL_BODY_AB] Adding missing...` — no longer emitted

> Note: `volumeCalculator.ts` and `progressiveOverload.ts` still live in `apps/web/src/utils` and `packages/shared/src/utils` for the *web* logging/progression flow. They are **not** used during plan generation.

---

## Debugging Tips

- Check server logs for `[Gemini ...]` token usage output after each generation (`prompt`, `thinking`, `response`, `total`).
- If Gemini returns unknown exercise IDs, look for `⚠ N unknown exercise ID(s): [...]` in logs.
- If a day has 0 valid exercises after ID resolution, the request throws — check `prepareExercisesForPrompt` output for the user.
- Set `GEMINI_API_KEY` in backend `.env` — generation will silently fail without it.
- To test prompt changes locally without burning tokens, log the output of `buildSystemInstruction(parsedQuiz)` and `buildUserPrompt(parsedQuiz, exercises)` and inspect them directly.
