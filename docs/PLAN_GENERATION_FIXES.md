# Plan Generation Fixes Applied

## ✅ Changes Made (February 8, 2026)

### 1. **Volume Calculator** (`volumeCalculator.ts`)
- **Changed:** Intermediate sets from `3 → 4` sets
- **Impact:** Increases weekly volume from ~21 sets to ~28-32 sets
- **Result:** Better hypertrophy stimulus for intermediate trainees

### 2. **Full Body AB Requirements** (`planGeneratorHelpers.ts`)
#### Day A Requirements:
```typescript
requiredExerciseTypes: [
  "push_horizontal",
  "pull_horizontal",
  "leg_compound",
  "hamstring_isolation",  // ✨ NEW
  "core_stability"        // ✨ NEW
]
```

#### Day B Requirements:
```typescript
requiredExerciseTypes: [
  "push_horizontal",
  "pull_vertical",
  "leg_compound",
  "leg_isolation",
  "core_stability"        // ✨ NEW
]
```

### 3. **Exercise Detection Logic** (`planGeneratorHelpers.ts`)
Added helper functions:
- `isHamstringIsolation()` - Detects leg curls and hamstring-focused exercises
- `isCoreStability()` - Detects plank, dead bug, bird dog, etc.

Added enforcement logic:
- Automatically adds missing hamstring isolation to Day A
- Automatically adds missing core work to both days
- Logs warnings when exercises are missing or added

### 4. **Sets Assignment** (`planGenerator.ts`)
- **Fixed:** Now ALWAYS overwrites sets with current experience level
- **Issue:** Old exercises from history were keeping `sets: 3`
- **Solution:** Force update `sets: volumeRecommendation.setsPerExercise`

## 📊 Expected New Plan Structure

### Day A (5 exercises, 20 sets, ~40 min)
1. **Push** (Chest Press) - 4 sets x 12 reps
2. **Horizontal Pull** (Cable Row) - 4 sets x 14 reps
3. **Leg Compound** (Leg Press) - 4 sets x 12 reps
4. **Hamstring Isolation** (Leg Curl) - 4 sets x 12 reps ✨ NEW
5. **Core Stability** (Dead Bug/Plank) - 4 sets x 12 reps ✨ NEW

### Day B (5 exercises, 20 sets, ~40 min)
1. **Push** (Chest Fly) - 4 sets x 12 reps
2. **Glute/Hamstring** (Cable Kickback) - 4 sets x 12 reps
3. **Vertical Pull** (Lat Pulldown) - 4 sets x 10 reps  
4. **Quad Isolation** (Leg Extension) - 4 sets x 12 reps
5. **Core Stability** (Bird Dog/Plank) - 4 sets x 12 reps ✨ NEW

**Total: 40 sets/week** (up from 21-26)

## 🔄 Required Action

**The current plan you showed was generated BEFORE these changes.**

### To get the new plan:
1. **Reload the application** (hard refresh or restart server)
2. **Regenerate the plan** from scratch
3. **Verify new plan includes:**
   - ✅ All exercises have 4 sets (not 3)
   - ✅ Day A has hamstring isolation (leg curl)
   - ✅ Both days have core work (plank/dead bug/bird dog)
   - ✅ Total weekly sets: 35-40 sets

### If exercises are missing:
The system will log warnings like:
```
[FULL_BODY_AB] Adding missing hamstring isolation to Day A: Lying Leg Curl
[FULL_BODY_AB] Adding missing core work to Day A: Dead Bug
[FULL_BODY_AB] Adding missing core work to Day B: Plank
```

Check the browser console for these logs.

## 🎯 Success Criteria

After regenerating, the plan should pass:
- ✅ Duration: 35-45 min per session (vs claimed 45-60 min)
- ✅ Volume: 35-40 sets/week (intermediate hypertrophy range)
- ✅ Balance: Hamstrings addressed on Day A
- ✅ Safety: Core stability for sciatica support
- ✅ Consistency: All exercises have 4 sets

## 📝 Notes

### Why the old plan still had issues:
1. **Sets inconsistency** - exercises from history kept old `sets: 3`
2. **Missing exercises** - requirements file wasn't updated in memory
3. **Short duration** - only 3-4 exercises per day (now 5)

### Fix verification:
Run the test suite:
```bash
npm test -- fullBodyAB.test.ts
```

The LLM feedback tests should now show:
- ⚠️ Volume: Still below optimal (will pass at 35-40 sets)
- ⚠️ Duration: Closer to target (will pass at 35+ min)
- ❌ → ✅ Hamstring isolation: Should now exist on Day A
- ❌ → ✅ Core work: Should now exist on both days

## 🚀 Next Steps

1. Restart application/server
2. Regenerate plan
3. Review plan JSON
4. Run tests to verify
5. If still issues, check console logs for warnings

---
**Last Updated:** February 8, 2026
**Status:** ✅ Code changes applied, awaiting plan regeneration
