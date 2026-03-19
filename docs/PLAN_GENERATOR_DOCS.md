# Plan Generator — Developer Reference

Two files work together to generate personalised training plans from quiz answers and plan settings.

---

## File Overview

| File | Purpose |
|------|---------|
| `planGenerator.ts` | Main orchestrator — filters exercises, assigns them to days, applies coaching rules, returns `GeneratedPlan` |
| `planGeneratorHelpers.ts` | Split logic — determines which split type to use, enforces day requirements, builds `sourceOnboarding` metadata |

---

## planGeneratorHelpers.ts

### Exported Types

| Type | Description |
|------|-------------|
| `SourceOnboarding` | Snapshot of everything the user answered in onboarding (goal, gender, age, pain, split, etc.) |
| `SplitType` | Union of all possible split identifiers (e.g. `"FULL_BODY_AB"`, `"UPPER_LOWER_4X"`) |
| `AlternativeSplitType` | Subset used for alternative plan cards (`"BRO_SPLIT" \| "PPL" \| "FRESH_MUSCLES"`) |
| `WorkoutSplit` | The resolved split with `type`, `name`, `days[]`, and `rationale` |
| `DayStructure` | Single day spec: `dayLabel`, `focus[]`, `exerciseGuidelines?`, `requiredExerciseTypes?` |

---

### `determineWorkoutSplit(experience, trainingFrequency, painStatus?)` → `WorkoutSplit`
**Line ~62**

Decision table that picks the right split for a user. Called inside `buildSourceOnboarding`.

| Frequency | Beginner | Intermediate | Advanced (healthy) | Advanced (pain) |
|-----------|----------|-------------|-------------------|----------------|
| 2 days | FULL_BODY_AB | FULL_BODY_AB | FULL_BODY_AB | FULL_BODY_AB |
| 3 days | FULL_BODY_ABC | UPPER_LOWER_UPPER | PUSH_PULL_LEGS | UPPER_LOWER_UPPER |
| 4 days | FULL_BODY_4X | UPPER_LOWER_4X | UPPER_LOWER_STRENGTH_HYPERTROPHY | UPPER_LOWER_4X |
| 5+ days | UPPER_LOWER_4X | UPPER_LOWER_4X | PUSH_PULL_LEGS (5-day) | UPPER_LOWER_4X |

**FULL_BODY_AB days have `requiredExerciseTypes`** — these are enforced later by `enforceFullBodyABRequirements`.

Day A required: `push_horizontal`, `pull_horizontal`, `leg_compound`, `hamstring_isolation`, `core_stability`
Day B required: `push_horizontal`, `pull_vertical`, `leg_compound`, `leg_isolation`, `core_stability`

---

### `buildSourceOnboarding(quizAnswers, planSettings)` → `SourceOnboarding | undefined`
**Line ~590**

Transforms raw quiz answer indices → human-readable strings and stores everything in a `SourceOnboarding` object.
Also calls `determineWorkoutSplit` and attaches the result as `split`.
Returns `undefined` if no quiz answers (settings-only flow).

**Quiz answer ID map used here:**

| Answer ID | Field |
|-----------|-------|
| 2 | goal |
| 3 | gender, dateOfBirth, height, weight (multi_field) |
| 7 | bodyType |
| 8 | experience |
| 9 | trainingFrequency |
| 10 | painStatus |
| 11 | painLocation |
| 13 | painTriggers |
| 14 | canSquat |
| 15 | workoutDuration |

---

### `enforceFullBodyABRequirements(workoutDays, allExercises, split)` → `T[]`
**Line ~369**

Only runs when `split.type === "FULL_BODY_AB"` and there are exactly 2 days.
Goes through each day's `requiredExerciseTypes` and adds missing exercises from `allExercises`.
Also removes duplicate pull exercises (keeps only 1 pull per day — horizontal on Day A, vertical on Day B).

Called near the end of `generateTrainingPlan` right before volume is applied.

---

### `validateFullBodyABSplit(workoutDays, split)` → `{ isValid, errors[] }`
**Line ~275**

Diagnostic helper — not called during plan generation. Use for debugging/testing to verify a 2-day plan is correct.

---

## planGenerator.ts

### Exported Types

| Type | Description |
|------|-------------|
| `GeneratedPlan` | The final plan: `id`, `name`, `splitType`, `settings`, `sourceOnboarding`, `workoutDays[]`, `missingMuscleGroups[]`, `alternativeExercises[]` |
| `AlternativeSplit` | Lightweight plan card for the "other splits" section |
| `WorkoutDay` | Re-exported from `splitScheduler` |

---

### Main Entry Point

### `generateTrainingPlan(allExercises, planSettings, quizAnswers, availableEquipment, workoutHistory)` → `GeneratedPlan`
**Line ~265**

The single function called from outside to produce a full plan. Steps in order:

| Step | What happens | Key function |
|------|-------------|-------------|
| 0 | Merge quiz answers into plan settings | `mergePlanSettingsWithQuizAnswers` |
| 1 | Build pain profile (quiz overrides settings) | `extractPainProfile` / `extractPainProfileFromSettings` |
| 2 | Build filter criteria | — |
| 3 | Filter exercises by profile | `filterExercisesByProfile` |
| 4 | Apply progressive overload (if history) | `applyProgressionToExercises` |
| 5 | Calculate volume recommendations | `calculateVolume` |
| 6 | Calculate exercises per workout (min 4, max 6) | `calculateExercisesPerWorkout` |
| 7 | Parse workouts/week | `parseWorkoutsPerWeek` |
| 8 | Create weekly schedule | `createWeeklySchedule` |
| 9 | Map split → muscle groups per day | `mapSplitToMuscleGroups` |
| 10 | Assign exercises to days | `assignExercisesToDays` |
| 10.1 | Restructure 3-day Full Body / ULU days | `restructureThreeDayFullBody` |
| 10.2 | Cap lower-day exercises to 3 (Upper/Lower only) | inline |
| 10.3 | Rebalance upper/lower day push/pull ratio | `rebalanceUpperLowerDays` |
| 10.4 | Apply progression guardrails for pain users | `applyProgressionGuardrails` |
| 10.5 | Global pull ≥ push safeguard | `enforcePullNotLessThanPush` |
| 10.6 | Ensure ≥1 vertical pull per week | `ensureWeeklyVerticalPull` |
| 10.7 | Avoid repeating Seated Cable Row >2×/week | `enforceRowVariability` |
| 10.8 | Ensure ≥1 rear-delt exercise per week | `ensureRearDeltWork` |
| 10.9 | Enforce FULL_BODY_AB day requirements | `enforceFullBodyABRequirements` |
| 11 | Apply sets/reps/weight to all exercises | inline volume map |
| 12 | Find missing muscle groups + alternatives | `getMissingMuscleGroups` / `getAlternativeExercises` |
| 13 | Generate plan ID and name | `generatePlanId` / `generatePlanName` |

---

### Coaching Rule Functions (internal)

#### `rebalanceUpperLowerDays(days, allExercises, trainingSplit, painProfile)`
**Line ~558**
Only fires for `Upper/Lower` split. Ensures each upper day has:
- ≥ 2 pulls if ≥ 2 presses
- Exactly 1 vertical pull (removes extras)
- 1 horizontal pull (adds Seated Cable Row if missing)
- Replaces dips with a vertical pull or rope pressdown
- Adds Bird Dog core once per week for back users
- Lower days: adds Lying/Seated Leg Curl if no hamstring curl present

Also has a **weekly safeguard**: if user has back history and weekly_press > weekly_pull, replaces a chest fly with Lat Pulldown.

---

#### `enforcePullNotLessThanPush(days, allExercises)`
**Line ~775**
Global check across any split. While `press > pull` weekly, adds pulls to the day with fewest pulls. Priority order: Lat Pulldown → Pull-Up → Chin-Up → Seated Cable Row → Chest Supported Row → Cable Face Pull → Reverse Pec Deck.

---

#### `ensureWeeklyVerticalPull(days, allExercises)`
**Line ~854**
If no vertical pull exists anywhere in the week, finds the best day (prefers "Pull Focus" / "Day C" → upper body day → most pulls → first day) and either replaces a horizontal pull or adds the vertical pull. Uses unfiltered `allExercises` so it works even if the exercise was filtered out.

---

#### `ensureRearDeltWork(days, allExercises)`
**Line ~1008**
If no rear-delt exercise exists, adds Cable Face Pull (or Reverse Pec Deck / Band Pull Apart) to the first upper body day. Forces `sets: 3, reps: 15, weight: 50% of default`.

---

#### `enforceRowVariability(days, allExercises)`
**Line ~1092**
If Seated Cable Row appears >2 times/week, replaces the last occurrence with Chest Supported Row → One-Arm Crossover → Straight-Arm Pulldown.

---

#### `restructureThreeDayFullBody(days, trainingSplit, workoutsPerWeek, allExercises, splitType?)`
**Line ~1143**
Fires only when `workoutsPerWeek === 3` and split is `Full Body` or `Upper/Lower`.

**UPPER_LOWER_UPPER path** (`splitType === "UPPER_LOWER_UPPER"`):
- Day 1 Upper A: 2 push + 1 horizontal pull + 1 vertical pull
- Day 2 Lower: hinge + quad + hamstring + second quad
- Day 3 Upper B: vertical pull + different horizontal pull + push variation + rear delt

**FULL_BODY_ABC path** (default):
- Day A (Push Bias): 2 push + quad + horizontal pull + core
- Day B (Lower Focus): hinge + quad + hamstring — **no upper body at all**
- Day C (Pull Focus): vertical pull + horizontal pull + hamstring + rear delt — **no push**

---

#### `applyProgressionGuardrails(days, painProfile)`
**Line ~1384**
For users with `painLevel > 3`: locks weight at last session value, increments reps by +1 (max 15).
For back-friendly exercises under load: caps weight increase at 5% per week.

---

### Quiz-to-Settings Functions (internal)

#### `mergePlanSettingsWithQuizAnswers(planSettings, quizAnswers)` → `PlanSettings`
**Line ~1449**

Full quiz answer ID → `PlanSettings` field mapping:

| Answer ID | Maps to |
|-----------|--------|
| 2 | `goal` |
| 3 | `gender`, `height`, `weight`, `dateOfBirth` |
| 7 | `bodyType` |
| 8 | `experience` |
| 9 | `workoutsPerWeek` + auto-selects `trainingSplit` |
| 10 | `painStatus` |
| 11 | `painLocation` |
| 12 | `painLevel` |
| 13 | `painTriggers` |
| 14 | `canSquat` |
| 15 | `duration` |

Also auto-derives `trainingSplit` from frequency: ≤2→Full Body, 3→Full Body, 4→Upper/Lower, 5+→Push/Pull/Legs.

---

### Other Exported Functions

#### `generateAlternativeSplitsForPlan(plan, allExercises)` → `AlternativeSplit[]`
**Line ~238**
Generates 2–3 alternative split cards for an existing plan (Upper/Lower, PPL, Bro Split). Uses the same exercise filter as the original plan. Called on demand from the UI.

#### `applyVolumeSafetyToLoadedPlan(plan)` → `GeneratedPlan`
**Line ~1814**
Re-applies set count guardrails when loading a saved plan (in case settings changed). Calls `getSafeSetsFromSettings` internally.

#### `getTodaysWorkout(plan)` → `WorkoutDay | null`
**Line ~1835**
Returns the workout day matching today's day of week (0 = Monday system).

---

### Internal Helper Predicates

These small functions are used throughout as building blocks:

| Function | What it detects | Line |
|----------|----------------|------|
| `isPress(e)` | chest / front_delts / upper_chest exercises | ~35 |
| `isPull(e)` | lats / upper_back / rear_delts / biceps exercises | ~40 |
| `hasVerticalPull(e)` | pulldown / pull-up / chin-up / straight-arm by name or equipment | ~45 |
| `isCoreStability(e)` | plank / bird dog / dead bug / hollow — bodyweight core holds | ~59 |
| `isRearDeltExercise(e)` | rear_delts muscle group or face pull / reverse fly / band pull apart names | ~81 |
| `dedupeExercises(list)` | removes duplicate exercise IDs from an array | ~96 |
| `findExerciseByName(all, name)` | case-insensitive name lookup in exercise array | ~106 |

---

## Quick Lookup: "Where do I change X?"

| Want to change… | Go to |
|----------------|-------|
| Which split is assigned to beginner 3×/week | `determineWorkoutSplit` in `planGeneratorHelpers.ts` ~L71 |
| What exercises are required on FULL_BODY_AB Day A/B | `determineWorkoutSplit` → FULL_BODY_AB `requiredExerciseTypes` ~L196 |
| How sets/reps are determined | `calculateVolume` in `volumeCalculator.ts` (called at step 5) |
| Max exercises per workout (currently 4–6) | `generateTrainingPlan` ~L353 |
| Push/pull balance rules on upper days | `rebalanceUpperLowerDays` ~L558 |
| Day A / B / C exercise composition | `restructureThreeDayFullBody` ~L1275 |
| ULU Day 1 / 2 / 3 exercise composition | `restructureThreeDayFullBody` UPPER_LOWER_UPPER path ~L1203 |
| Pain-based set reduction logic | `generateTrainingPlan` ~L470 + `applyProgressionGuardrails` ~L1384 |
| Plan name format | `generatePlanName` ~L1781 |
| Alternative splits shown on plan screen | `generateAlternativeSplits` (internal) ~L142 |
| Quiz answer index → human string mappings | `mergePlanSettingsWithQuizAnswers` ~L1449 or `buildSourceOnboarding` ~L590 |
