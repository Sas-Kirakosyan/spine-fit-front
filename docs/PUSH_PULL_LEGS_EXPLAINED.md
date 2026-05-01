# Understanding Push/Pull/Legs 3-Day Split

## What Happens When You Generate a Plan

### Your Settings

- **Training Split**: Push/Pull/Legs
- **Frequency**: 3 days per week
- **Duration**: 45 min (example)
- **Experience**: Intermediate

---

## Generated Weekly Schedule

### 📅 Monday - PUSH DAY

**Target Muscles**: Chest, Front Delts, Triceps

**Example Exercises** (4-5 exercises):

1. Bench Press (or variations)
   - 3 sets x 10 reps @ 60kg
   - Muscle groups: chest, front_delts, triceps

2. Shoulder Press
   - 3 sets x 10 reps @ 30kg
   - Muscle groups: front_delts, triceps

3. Chest Fly
   - 3 sets x 12 reps @ 15kg
   - Muscle groups: chest

4. Tricep Extension
   - 3 sets x 12 reps @ 10kg
   - Muscle groups: triceps

---

### 📅 Wednesday - PULL DAY

**Target Muscles**: Lats, Upper Back, Rear Delts, Biceps

**Example Exercises** (4-5 exercises):

1. Cable Pull / Lat Pulldown
   - 3 sets x 12 reps @ 20kg
   - Muscle groups: lats, upper_back

2. Back Hyperextension ✅ (back-safe)
   - 3 sets x 15 reps @ 0kg
   - Muscle groups: erector_spinae, glutes
   - ⚠️ Safety: Keep spine neutral

3. Row Variation
   - 3 sets x 10 reps @ 40kg
   - Muscle groups: lats, upper_back, rear_delts

4. Bicep Curls
   - 3 sets x 12 reps @ 15kg
   - Muscle groups: biceps

---

### 📅 Friday - LEGS DAY

**Target Muscles**: Quads, Glutes, Hamstrings

**Example Exercises** (4-5 exercises):

1. Single-Leg Glute Bridge ✅ (back-safe)
   - 3 sets x 12 reps @ 0kg
   - Muscle groups: glutes, hamstrings, core_stabilizers

2. Bulgarian Split Squats
   - 3 sets x 10 reps @ 4kg (dumbbells)
   - Muscle groups: quads, glutes

3. Leg Extension (machine)
   - 4 sets x 12 reps @ 25kg
   - Muscle groups: quads

4. Leg Curls
   - 3 sets x 12 reps @ 20kg
   - Muscle groups: hamstrings

5. Hip Thrust
   - 3 sets x 12 reps @ 40kg
   - Muscle groups: glutes, hamstrings

---

### 🏖️ Rest Days

- **Tuesday**: Rest
- **Thursday**: Rest
- **Saturday**: Rest
- **Sunday**: Rest

---

## How It Works: Behind the Scenes

> **Plan generation is now AI-driven.** The backend builds a filtered exercise list and a system + user prompt, then asks Google Gemini to assemble the plan. There is no local rule-based generator. See [`PLAN_GENERATION_FIXES.md`](./PLAN_GENERATION_FIXES.md) for the full picture.

### 1. Split mapping (`splitUtils.ts`)

```
Input: "Push/Pull/Legs"
↓
mapSplitType() → "PUSH_PULL_LEGS"
↓
SPLIT_TARGET_MUSCLES["PUSH_PULL_LEGS"] =
  ["chest", "front_delts", "triceps",
   "lats", "upper_back", "rear_delts", "biceps",
   "quads", "glutes", "hamstrings"]
```

The split-type key is also used by the user prompt — `buildSplitDayGuidance` injects a `SPLIT DAY STRUCTURE` section telling Gemini that Push = chest/front_delts/triceps, Pull = lats/upper_back/rear_delts/biceps (with vertical + horizontal pull required), Legs = quads/hamstrings/glutes.

### 2. Exercise filter (`exerciseFilter.ts`)

`prepareExercisesForPrompt()` strips exercises before Gemini ever sees them:

- **Active Symptoms** → drop non-back-friendly exercises and any with `medium`/`high` restriction levels.
- **Experience filter** → Beginner and Intermediate users never see `advanced` exercises.
- **Pain trigger filter** → if the user flagged "Weighted Squats or Deadlifts" or "Lifting objects from the floor", drop any exercise with a `high` restriction level.

The remaining exercises are projected to a lean `PromptExercise` shape and rendered as a pipe-delimited table inside the user prompt.

### 3. System prompt selection (`promptBuilder.ts`)

`buildSystemInstruction(quiz)` dispatches on `painStatus`:

- `Active Symptoms` → `buildActivePrompt` (RPE 5–6, conservative load, lumbar/sciatic protocol always on, hip-adduction mandate).
- `Recovered` → `buildRecoveredPrompt` (RPE 6–7, lumbar/sciatic block enabled only when pain locations include lower back / L4 / L5 / S1 / lumbar / sciatic).
- anything else → `buildHealthyPrompt` (RPE 7–8, performance-focused with spine-safe defaults).

All three prompts share the same scaffolding: `exerciseId`-only references, `exerciseCountForDuration()` range, vertical + horizontal pull requirement, push requirement, lower-body compound + squat-confidence substitution, volume control, no-repeat-within-day, NOTES field format, plan name, `weeks=4`, never hallucinate IDs.

### 4. Gemini call (`geminiService.ts`)

The backend calls `gemini-2.5-flash` with `responseSchema: PLAN_SCHEMA`. On failure it falls back to `gemini-3.1-flash-lite-preview`.

### 5. Post-generation validation (`geminiService.ts`)

- Drop any returned `exerciseId` not present in the local exercise map (logs a warning).
- Throw if any day has 0 valid exercises after ID resolution.
- Compute `missingMuscleGroups` = `SPLIT_TARGET_MUSCLES[splitType]` minus muscles actually covered, then suggest back-friendly alternatives.

### Progressive overload — handled inside the plan, not as a separate step

Each exercise's `notes` field carries a 4-week progression block (e.g. `W1: 3×10 | W2: 3×12 | W3: 4×10 | W4: 4×12`) plus a load rule (`Increase weight by 2.5 kg when all reps completed with good form`). Pain-history users also receive a pain rule (`If pain increases → reduce load or ROM. Sharp/nerve pain → stop immediately`). Session-by-session weight tracking still uses `progressiveOverload.ts` on the web app side, but it is not part of plan generation.

---

## What You See in the App

### My Plan Page After Generation:

```
✅ Plan Generated!

Push/Pull/Legs - 3x per week

📅 Workout Days:
• Monday - 4 exercises
• Wednesday - 4 exercises
• Friday - 4 exercises

Created: Dec 18, 2025, 8:30 PM
```

### Active Workout Page (on Monday):

```
🔥 PUSH DAY

⏱️ 00:00:00

Exercise 1: Bench Press
3 sets × 10 reps @ 60kg
[Tap to start]

Exercise 2: Shoulder Press
3 sets × 10 reps @ 30kg
[Tap to start]

...

[Finish Workout]
```

---

## Key Features

### ✅ Automatic Day Distribution

- 3 days/week → **Mon, Wed, Fri** (evenly spaced)
- 4 days/week → **Mon, Tue, Thu, Fri**
- 5 days/week → **Mon, Tue, Wed, Fri, Sat**

### ✅ Smart Exercise Selection

- Prioritizes **compound movements** (multi-joint exercises)
- Ensures **at least 1 exercise per major muscle group**
- Respects **back safety restrictions** based on pain profile
- Only uses **available equipment**

### ✅ Volume Adaptation

| Duration | Sets/Workout | Exercises/Day |
| -------- | ------------ | ------------- |
| 30 min   | ~8-10 sets   | 2-3 exercises |
| 45 min   | ~12 sets     | 4 exercises   |
| 1 hour   | ~15-18 sets  | 5-6 exercises |

### ✅ Experience Scaling

| Level        | Sets/Exercise | Total Volume |
| ------------ | ------------- | ------------ |
| Beginner     | 2 sets        | 80% base     |
| Intermediate | 3 sets        | 100% base    |
| Advanced     | 4 sets        | 120% base    |

### ✅ Pain Adaptation

If pain level > 5:

- ⬇️ Reduce total volume by 20%
- ⬆️ Increase reps to 15 (lighter weight)
- ❌ Exclude high-restriction exercises
- ✅ Prioritize low-restriction exercises

---

## Testing Your Plan

### Method 1: Run Tests (Git Bash)

```bash
npm test pushPullLegs
```

### Method 2: Browser Console

1. Open app → My Plan page
2. Press F12 → Console
3. Copy/paste code from: `src/utils/__tests__/demoPushPullLegs.js`
4. See full breakdown of your generated plan

### Method 3: UI Testing

1. Complete quiz (pain profile)
2. Select equipment
3. Configure: PPL, 3 days/week, 45 min
4. Click "Generate Plan"
5. Check each workout day's exercises
6. Go to Active Workout → verify today's exercises load

---

## Summary

**Yes!** When you choose **Push/Pull/Legs** with **3 days per week**, the system:

✅ Generates **3 complete workout plans** (one for each day)  
✅ Assigns exercises to **Monday, Wednesday, Friday**  
✅ Each day targets **different muscle groups** (Push/Pull/Legs pattern)  
✅ Calculates appropriate **volume** (sets/reps) based on duration  
✅ Adjusts for **pain level** and **experience**  
✅ Only uses **your available equipment**  
✅ Saves to **localStorage** for workout execution  
✅ Loads automatically in **Active Workout** page

Each day will have **4-5 exercises** (for 45 min duration) with **3 sets × 10-12 reps** (for intermediate level).
