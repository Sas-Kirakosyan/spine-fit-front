/**
 * Manual Testing Script for Plan Generator
 * 
 * Copy and paste this into your browser console while on the My Plan page
 */

// Test 1: Check if all localStorage data is present
console.log('📋 Test 1: Check localStorage data');
console.log('='.repeat(50));

const quizAnswers = localStorage.getItem('quizAnswers');
const planSettings = localStorage.getItem('planSettings');
const equipmentData = localStorage.getItem('equipmentData');

console.log('Quiz Answers:', quizAnswers ? JSON.parse(quizAnswers) : '❌ Not found');
console.log('Plan Settings:', planSettings ? JSON.parse(planSettings) : '❌ Not found');
console.log('Equipment Data:', equipmentData ? JSON.parse(equipmentData) : '❌ Not found');
console.log('\n');

// Test 2: Check generated plan
console.log('📋 Test 2: Check generated plan');
console.log('='.repeat(50));

const generatedPlan = localStorage.getItem('generatedPlan');
if (generatedPlan) {
  const plan = JSON.parse(generatedPlan);
  console.log('✅ Plan found!');
  console.log('Plan Name:', plan.name);
  console.log('Created:', new Date(plan.createdAt).toLocaleString());
  console.log('Workout Days:', plan.workoutDays.length);

  plan.workoutDays.forEach((day, index) => {
    console.log(`  Day ${ index + 1 } (${ day.dayName }):`,
      day.exercises.length, 'exercises',
      '- Muscle groups:', day.muscleGroups.join(', ')
    );
  });

  if (plan.missingMuscleGroups.length > 0) {
    console.warn('⚠️ Missing muscle groups:', plan.missingMuscleGroups.join(', '));
    console.log('Alternative exercises suggested:', plan.alternativeExercises.length);
  }
} else {
  console.log('❌ No plan generated yet. Click "Generate Plan" button first.');
}
console.log('\n');

// Test 3: Get today's workout
console.log('📋 Test 3: Get today\'s workout');
console.log('='.repeat(50));

if (generatedPlan) {
  const plan = JSON.parse(generatedPlan);
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday
  const adjustedDay = today === 0 ? 6 : today - 1;

  const todaysWorkout = plan.workoutDays.find(day => day.dayNumber === adjustedDay);

  if (todaysWorkout) {
    console.log('✅ Today\'s workout found!');
    console.log('Day:', todaysWorkout.dayName);
    console.log('Exercises:');
    todaysWorkout.exercises.forEach((ex, i) => {
      console.log(`  ${ i + 1 }. ${ ex.name } - ${ ex.sets }x${ ex.reps } @ ${ ex.weight }${ ex.weight_unit }`);
    });
  } else {
    console.log('🏖️ Today is a rest day!');
  }
} else {
  console.log('❌ No plan available');
}
console.log('\n');

// Test 4: Check workout history for progressive overload
console.log('📋 Test 4: Check workout history');
console.log('='.repeat(50));

const workoutHistory = localStorage.getItem('workoutHistory');
if (workoutHistory) {
  const history = JSON.parse(workoutHistory);
  console.log('✅ Workout history found!');
  console.log('Total workouts:', history.length);

  if (history.length > 0) {
    const lastWorkout = history[0];
    console.log('\nLast workout:');
    console.log('  Date:', new Date(lastWorkout.finishedAt).toLocaleString());
    console.log('  Duration:', lastWorkout.duration);
    console.log('  Exercises:', lastWorkout.exerciseCount);
    console.log('  Total Volume:', lastWorkout.totalVolume, 'kg');

    // Check last performed data for each exercise
    console.log('\n  Exercise details:');
    Object.entries(lastWorkout.completedExerciseLogs).forEach(([exerciseId, sets]) => {
      const exercise = lastWorkout.completedExercises.find(e => e.id === parseInt(exerciseId));
      if (exercise && Array.isArray(sets)) {
        console.log(`    ${ exercise.name }:`, sets.length, 'sets');
        sets.forEach((set, i) => {
          console.log(`      Set ${ i + 1 }: ${ set.reps } reps x ${ set.weight }kg`);
        });
      }
    });
  }
} else {
  console.log('❌ No workout history yet');
}
console.log('\n');

// Test 5: Simulate plan generation (if you want to test without UI)
console.log('📋 Test 5: Test plan generation function');
console.log('='.repeat(50));
console.log('To test plan generation programmatically, run:');
console.log(`
// Import the function first (in actual code)
import { generateTrainingPlan } from '@/utils/planGenerator';

// Then generate a plan
const testPlan = generateTrainingPlan(
  allExercises,
  {
    goal: "Build muscle safely",
    workoutsPerWeek: "3 days per week",
    duration: "45 min",
    experience: "Intermediate",
    trainingSplit: "Push/Pull/Legs",
    exerciseVariability: "Balanced",
    units: "kg",
    cardio: "Off",
    stretching: "Off"
  },
  JSON.parse(localStorage.getItem('quizAnswers')),
  ['bodyweight', 'dumbbells', 'barbell'],
  JSON.parse(localStorage.getItem('workoutHistory') || '[]')
);

console.log('Generated plan:', testPlan);
`);

console.log('\n✅ All tests complete!');
console.log('='.repeat(50));
