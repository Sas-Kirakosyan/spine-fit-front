# Plan Generator — Developer Reference

> **This document is obsolete.** It used to describe the local rule-based plan generator (`planGenerator.ts` / `planGeneratorHelpers.ts`), which has been fully removed. Plan generation now happens server-side via Google Gemini.
>
> See **[`PLAN_GENERATION_FIXES.md`](./PLAN_GENERATION_FIXES.md)** for the current architecture, including:
>
> - The end-to-end Gemini flow (`exerciseFilter.ts` → `promptBuilder.ts` → Gemini → `geminiService.ts`)
> - Filtering rules (Active Symptoms gating, experience-based difficulty filter, pain-trigger high-load filter)
> - System prompt selection (Healthy / Recovered / Active Symptoms) and the L5-S1 / sciatica protocol
> - Split mapping and target-muscle coverage in `splitUtils.ts`
> - Post-generation validation (unknown ID drop, empty-day guard, missing-muscle alternatives)
