# Training Plan Generator - Testing Guide

## Quick Manual Testing (Easiest Way)

### Step 1: Setup Mock Data

1. Open your app in the browser
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Run the manual test script:

```javascript
// Copy the content from src/utils/__tests__/manualTest.js
// and paste it into the console
```

### Step 2: Test the UI Flow

#### A. Complete the Quiz

1. Navigate to the Quiz (usually on first launch or in settings)
2. Answer these test questions:
   - **Goal**: "Build muscle safely (gym-goer with back or sciatic pain)"
   - **Gender**: Male
   - **Age**: 30-39
   - **Height**: 180 cm
   - **Weight**: 80 kg
   - **Experience**: Intermediate
   - **Training Frequency**: 3
   - **Pain Status**: "In the past" (or "Never" for easier testing)
   - **Training Location**: Gym
   - **Workout Duration**: "30-45 min"

#### B. Configure Equipment

1. Go to **My Plan** → **Equipment**
2. Select at least 3-5 pieces of equipment:
   - ✅ Bodyweight
   - ✅ Dumbbells
   - ✅ Barbell
   - ✅ Cable Machine
   - ✅ Bench

#### C. Configure Plan Settings

1. Go to **My Plan** page
2. Configure settings:
   - **Goal**: "Build muscle safely"
   - **Workouts/Week**: "3 days per week"
   - **Duration**: "45 min"
   - **Experience**: "Intermediate"
   - **Training Split**: "Push/Pull/Legs"
   - **Exercise Variability**: "Balanced"

#### D. Generate Plan

1. Click **"Generate Plan"** button
2. Wait for success alert
3. Verify:
   - ✅ Alert shows plan details
   - ✅ Generated plan section appears below
   - ✅ Shows workout days (e.g., Monday, Wednesday, Friday)
   - ✅ Shows exercises per day
   - ✅ No missing muscle groups (or alternatives suggested)

#### E. Test Workout Execution

1. Navigate to **Active Workout** page
2. Verify:
   - ✅ Today's workout loads automatically
   - ✅ Shows exercises from generated plan
   - ✅ Each exercise has sets/reps/weight filled in

### Step 3: Test Progressive Overload

#### A. Complete a Workout

1. Go to **Active Workout**
2. Tap an exercise → Enter sets/reps/weight
3. Mark exercise as complete
4. Repeat for all exercises
5. Tap **"Finish Workout"**
6. Log the workout

#### B. Test Progression (Next Day)

1. Generate a new plan (or wait for next workout day)
2. Go to **Active Workout**
3. Open an exercise you did before
4. Verify:
   - ✅ Sets/reps/weight are adjusted from last time
   - ✅ If you were consistent (< 7 days): weight should increase
   - ✅ If you missed > 7 days: weight should decrease

### Step 4: Test Edge Cases

#### Test Case 1: No Equipment

1. Go to Equipment page
2. Deselect all equipment
3. Enable "Bodyweight Only" toggle
4. Generate plan
5. Verify: Only bodyweight exercises appear

#### Test Case 2: High Pain Level

1. Retake quiz
2. Set **Pain Status**: "Yes, currently"
3. Set **Pain Level**: 8
4. Set **Pain Location**: "Lower back (L5-S1)"
5. Set **Can Squat**: "No"
6. Generate plan
7. Verify:
   - ✅ No squats or deadlifts
   - ✅ Only low-restriction exercises
   - ✅ Higher reps (12-15)
   - ✅ Fewer total sets

#### Test Case 3: Beginner vs Advanced

1. Generate plan as **Beginner**
   - Verify: 2 sets per exercise, simpler exercises
2. Change to **Advanced**
3. Generate plan again
   - Verify: 4 sets per exercise, more volume

---

## Automated Testing (Using Vitest)

### Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Run Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test planGenerator.test.ts
```

---

## Console Testing Commands

Open browser console on My Plan page and run:

```javascript
// 1. Check if plan exists
const plan = JSON.parse(localStorage.getItem("generatedPlan"));
console.log("Current plan:", plan);

// 2. Check today's workout
const today = new Date().getDay();
const adjustedDay = today === 0 ? 6 : today - 1;
const workout = plan?.workoutDays.find((d) => d.dayNumber === adjustedDay);
console.log("Today's workout:", workout);

// 3. Check workout history
const history = JSON.parse(localStorage.getItem("workoutHistory") || "[]");
console.log("Workout history:", history);

// 4. Check quiz answers
const quiz = JSON.parse(localStorage.getItem("quizAnswers") || "{}");
console.log("Quiz answers:", quiz);

// 5. Check equipment
const equipment = JSON.parse(localStorage.getItem("equipmentData") || "[]");
const selected = equipment.flatMap((cat) =>
  cat.items.filter((item) => item.selected).map((item) => item.name)
);
console.log("Selected equipment:", selected);
```

---

## Expected Results

### ✅ Successful Plan Generation Should Show:

- Plan name (e.g., "Push/Pull/Legs - 3x per week")
- 3 workout days for 3x/week frequency
- 4-6 exercises per workout for 45min duration
- Sets: 2-4 depending on experience
- Reps: 8-15 depending on goal and pain level
- All exercises use available equipment only
- No high-restriction exercises if pain > 5

### ✅ Progressive Overload Should:

- Increase weight by 2.5kg after consistent training
- OR increase reps by 1-2 if weight can't increase
- Decrease weight by 5-10% after 7+ days missed
- Show "last performed" data in UI

### ❌ Common Issues:

- **No exercises in plan**: Check equipment selection
- **Plan not loading in workout**: Check localStorage has 'generatedPlan'
- **No progression**: Check 'workoutHistory' exists in localStorage
- **Wrong exercises**: Check quiz pain profile answers

---

## Debugging Tips

1. **Clear all data and start fresh**:

```javascript
localStorage.clear();
location.reload();
```

2. **Force generate plan with mock data**:

```javascript
localStorage.setItem(
  "quizAnswers",
  JSON.stringify({
    workoutType: "gym",
    answers: { 10: "Never" },
  })
);

localStorage.setItem(
  "planSettings",
  JSON.stringify({
    goal: "Build muscle safely",
    workoutsPerWeek: "3 days per week",
    duration: "45 min",
    experience: "Intermediate",
    trainingSplit: "Full Body",
    exerciseVariability: "Balanced",
    units: "kg",
    cardio: "Off",
    stretching: "Off",
  })
);

// Then click Generate Plan button
```

3. **Check for errors in console**: Look for any red error messages

---

## Success Criteria

- [ ] Can generate plan with default settings
- [ ] Plan saves to localStorage
- [ ] Today's workout loads in Active Workout page
- [ ] Progressive overload works after completing workouts
- [ ] Plan adapts to pain level changes
- [ ] Equipment filtering works correctly
- [ ] Missing muscle groups show alternatives
- [ ] Can generate different splits (PPL, Upper/Lower, Full Body)
