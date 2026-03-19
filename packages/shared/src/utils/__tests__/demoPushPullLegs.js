/**
 * Demo: Push/Pull/Legs 3-Day Plan Generation
 * 
 * This script shows EXACTLY what happens when you:
 * - Choose Push/Pull/Legs split
 * - Select 3 days per week
 * - Click "Generate Plan"
 * 
 * Copy this into browser console on My Plan page to see your actual plan
 */

console.log('\n🏋️ DEMO: Push/Pull/Legs 3-Day Plan\n');
console.log('═'.repeat(70));

// Step 1: Check what you have configured
console.log('\n📋 Step 1: Your Current Settings\n');

const planSettings = localStorage.getItem('planSettings');
if (planSettings) {
  const settings = JSON.parse(planSettings);
  console.log('Training Split:', settings.trainingSplit);
  console.log('Workouts/Week:', settings.workoutsPerWeek);
  console.log('Duration:', settings.duration);
  console.log('Experience:', settings.experience);
  console.log('Goal:', settings.goal);
} else {
  console.log('❌ No plan settings found. Go to My Plan page and configure settings.');
}

// Step 2: Check equipment
console.log('\n🛠️  Step 2: Your Equipment\n');

const equipmentData = localStorage.getItem('equipmentData');
if (equipmentData) {
  const equipment = JSON.parse(equipmentData);
  const selected = equipment.flatMap(cat =>
    cat.items.filter(item => item.selected).map(item => item.name)
  );
  console.log('Selected equipment:', selected.length, 'items');
  console.log('Items:', selected.join(', '));
} else {
  console.log('❌ No equipment selected. Go to Equipment page.');
}

// Step 3: Check quiz answers
console.log('\n📝 Step 3: Your Pain Profile\n');

const quizAnswers = localStorage.getItem('quizAnswers');
if (quizAnswers) {
  const quiz = JSON.parse(quizAnswers);
  console.log('Pain Status:', quiz.answers?.[10] || 'Not answered');
  console.log('Experience:', quiz.answers?.[8] || 'Not answered');
  console.log('Frequency:', quiz.answers?.[9] || 'Not answered');
} else {
  console.log('⚠️  No quiz completed yet (optional)');
}

// Step 4: Show generated plan
console.log('\n🎯 Step 4: Your Generated Plan\n');

const generatedPlan = localStorage.getItem('generatedPlan');
if (generatedPlan) {
  const plan = JSON.parse(generatedPlan);

  console.log('✅ PLAN GENERATED!\n');
  console.log('Plan Name:', plan.name);
  console.log('Created:', new Date(plan.createdAt).toLocaleString());
  console.log('Total Workout Days:', plan.workoutDays.length);
  console.log('\n' + '─'.repeat(70) + '\n');

  // Show each workout day
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  plan.workoutDays.forEach((day, index) => {
    const splitType = index === 0 ? '🔥 PUSH' : index === 1 ? '💪 PULL' : '🦵 LEGS';

    console.log(`${ splitType } DAY - ${ dayNames[day.dayNumber] }`);
    console.log('─'.repeat(70));
    console.log('Target Muscles:', day.muscleGroups.join(', '));
    console.log(`Total Exercises: ${ day.exercises.length }\n`);

    day.exercises.forEach((exercise, exIndex) => {
      console.log(`  ${ exIndex + 1 }. ${ exercise.name }`);
      console.log(`     Sets: ${ exercise.sets } | Reps: ${ exercise.reps } | Weight: ${ exercise.weight }${ exercise.weight_unit }`);
      console.log(`     Muscle Groups: ${ exercise.muscle_groups.slice(0, 3).join(', ') }`);
      console.log(`     Equipment: ${ exercise.equipment }`);

      // Show any safety notes
      if (exercise.back_issue_restrictions && exercise.back_issue_restrictions.length > 0) {
        const restriction = exercise.back_issue_restrictions[0];
        console.log(`     ⚠️  Safety: ${ restriction.restriction_level } restriction - ${ restriction.recommendation }`);
      }
      console.log('');
    });

    console.log('─'.repeat(70) + '\n');
  });

  // Show rest days
  const workoutDayNumbers = plan.workoutDays.map(d => d.dayNumber);
  const restDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !workoutDayNumbers.includes(d));
  console.log('🏖️  Rest Days:', restDays.map(d => dayNames[d]).join(', '));
  console.log('\n');

  // Show missing muscle groups if any
  if (plan.missingMuscleGroups && plan.missingMuscleGroups.length > 0) {
    console.log('⚠️  MISSING MUSCLE GROUPS\n');
    console.log('These muscle groups aren\'t covered by your current equipment:');
    plan.missingMuscleGroups.forEach(mg => console.log('  •', mg));

    if (plan.alternativeExercises && plan.alternativeExercises.length > 0) {
      console.log('\n💡 Alternative exercises suggested:', plan.alternativeExercises.length);
      plan.alternativeExercises.forEach((ex, i) => {
        console.log(`  ${ i + 1 }. ${ ex.name } (${ ex.equipment })`);
      });
    }
    console.log('\n');
  }

  // Show summary
  console.log('📊 PLAN SUMMARY\n');
  const totalExercises = plan.workoutDays.reduce((sum, day) => sum + day.exercises.length, 0);
  const avgExercises = (totalExercises / plan.workoutDays.length).toFixed(1);
  const setsPerDay = plan.workoutDays[0]?.exercises[0]?.sets || 0;
  const totalSetsPerWeek = totalExercises * setsPerDay;

  console.log(`  • ${ plan.workoutDays.length } workouts per week`);
  console.log(`  • ${ avgExercises } exercises per workout (average)`);
  console.log(`  • ${ setsPerDay } sets per exercise`);
  console.log(`  • ${ totalSetsPerWeek } total sets per week`);
  console.log('\n');

} else {
  console.log('❌ NO PLAN GENERATED YET\n');
  console.log('👉 Go to My Plan page and click "Generate Plan" button\n');
}

console.log('═'.repeat(70));
console.log('\n💡 TIP: To get today\'s workout, check Active Workout page');
console.log('    It will automatically load exercises from your generated plan.\n');

// Quick check for today's workout
if (generatedPlan) {
  const plan = JSON.parse(generatedPlan);
  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;
  const todaysWorkout = plan.workoutDays.find(d => d.dayNumber === adjustedDay);

  if (todaysWorkout) {
    console.log('🎯 TODAY\'S WORKOUT:');
    console.log('   ', todaysWorkout.dayName, '-', todaysWorkout.exercises.length, 'exercises');
    console.log('   ', 'Muscle groups:', todaysWorkout.muscleGroups.slice(0, 3).join(', '));
  } else {
    console.log('🏖️  TODAY IS A REST DAY');
  }
  console.log('\n');
}
