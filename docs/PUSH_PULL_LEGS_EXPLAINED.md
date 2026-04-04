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

### 1. Split Scheduler (`splitScheduler.ts`)

```
Input: "Push/Pull/Legs" + 3 days/week
↓
Output:
- Day 1 (Monday): ["chest", "front_delts", "triceps"]
- Day 2 (Wednesday): ["lats", "upper_back", "rear_delts", "biceps"]
- Day 3 (Friday): ["quads", "glutes", "hamstrings"]
```

### 2. Exercise Filter (`exerciseFilter.ts`)

```
Available exercises: 10 (from allExercise.json)
↓
Filter by:
  ✓ Equipment available
  ✓ Pain profile (if L5-S1 pain, avoid high-restriction exercises)
  ✓ Experience level (Intermediate → allow intermediate exercises)
  ✓ Back safety (only back-friendly exercises)
↓
Safe exercises: ~7-8 exercises
```

### 3. Volume Calculator (`volumeCalculator.ts`)

```
Duration: 45 min
Experience: Intermediate
↓
Calculate:
- Total sets per workout: ~12 sets
- Sets per exercise: 3 sets
- Reps per set: 10-12 reps
- Exercises per workout: 12 ÷ 3 = 4 exercises
↓
Result: 4 exercises × 3 sets = 12 total sets per workout
```

### 4. Exercise Assignment

```
For PUSH day:
- Need exercises that target: chest, front_delts, triceps
- Filter available exercises by muscle groups
- Select best 4 compound + isolation exercises
- Assign 3 sets × 10 reps to each

For PULL day:
- Need exercises that target: lats, upper_back, rear_delts, biceps
- Repeat process

For LEGS day:
- Need exercises that target: quads, glutes, hamstrings
- Repeat process
```

### 5. Progressive Overload (`progressiveOverload.ts`)

```
IF user has workout history:
  - Load last performed weights for each exercise
  - Check consistency (gap between workouts)

  IF consistent (< 7 days gap):
    ✓ Increase weight by 2.5kg OR add 1-2 reps

  IF missed > 7 days:
    ⚠️ Decrease weight by 5-10% for safety

ELSE (first time):
  - Use default weights from exercise database
```

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
