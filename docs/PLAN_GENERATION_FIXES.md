# Plan Generation — Architecture & Current State

**Last Updated:** April 17, 2026
**Status:** ✅ LLM-based generation active

---

## How Plan Generation Works Now

Plan generation is fully handled by **Google Gemini AI** (no local algorithms).

### Flow

```
Quiz answers
    ↓
exerciseFilter.ts  ← filters the full exercise list by user constraints
    ↓
promptBuilder.ts   ← builds system instruction + user prompt (with filtered exercises as payload)
    ↓
Gemini API         ← returns structured JSON plan (validated against planSchema)
    ↓
geminiService.ts   ← resolves exercise IDs → full objects, computes missing muscle groups
    ↓
GeneratedPlanResult
```

### Key Files

| File                                         | Role                                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `apps/backend/src/services/geminiService.ts` | Main entry point — calls Gemini, parses response, builds final plan |
| `apps/backend/src/utils/exerciseFilter.ts`   | Filters exercise list before sending to AI                          |
| `apps/backend/src/utils/promptBuilder.ts`    | Builds system instruction and user prompt                           |
| `apps/backend/src/schemas/planSchema.ts`     | Gemini response schema (`PLAN_SCHEMA`)                              |
| `apps/backend/src/utils/splitUtils.ts`       | Maps split type → target muscle groups                              |

### Models

- **Primary:** `gemini-2.5-flash`
- **Fallback:** `gemini-3.1-flash-lite-preview` (used automatically if primary fails)

---

## Exercise Filtering (Pre-AI Step)

Before sending to Gemini, the exercise list is filtered based on quiz answers (pain status, restrictions, split type, etc.). Only the filtered list is sent as payload — **the AI never sees exercises the user can't do**.

---

## Post-Generation Validation

After Gemini responds, `geminiService.ts` does:

1. **ID validation** — checks all returned `exerciseId`s exist in the local exercise map; unknown IDs are dropped with a warning
2. **Empty day guard** — throws if any workout day ends up with 0 valid exercises
3. **Missing muscle groups** — computes which target muscles for the split aren't covered, suggests back-friendly alternatives

---

## What Was Removed

The following no longer exist and should not be referenced:

- `volumeCalculator.ts` — sets/volume is now decided by the AI
- `planGenerator.ts` / `planGeneratorHelpers.ts` — local rule-based plan generation fully removed
- Manual exercise type requirements (push/pull/leg/core slots) — AI handles structure
- Console log warnings like `[FULL_BODY_AB] Adding missing...` — no longer emitted

---

## Debugging Tips

- Check server logs for `[Gemini ...]` token usage output after each generation
- If Gemini returns unknown exercise IDs, a warning is logged: `⚠ N unknown exercise ID(s): [...]`
- If a day has 0 valid exercises after ID resolution, the request throws — check exercise filter output
- Set `GEMINI_API_KEY` in backend `.env` — generation will silently fail without it
