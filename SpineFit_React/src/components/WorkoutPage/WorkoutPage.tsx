import { useState } from "react";
import muscleIcon from "../../assets/muscle.png";

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description?: string;
  equipment?: string;
}

interface Workout {
  id: number;
  title: string;
  day: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  exercises: Exercise[];
  notes?: string;
}

interface WorkoutPageProps {
  onNavigateToHome: () => void;
}

export function WorkoutPage({ onNavigateToHome }: WorkoutPageProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Примеры тренировок для Home Workout
  const homeWorkouts: Workout[] = [
    {
      id: 1,
      title: "Full Body Strength - Home",
      day: "Day 1",
      duration: "45 minutes",
      difficulty: "Beginner",
      exercises: [
        {
          id: 1,
          name: "Bodyweight Squats",
          sets: 3,
          reps: "12-15",
          rest: "60 seconds",
          description: "Stand with feet shoulder-width apart, lower down as if sitting in a chair",
          equipment: "None",
        },
        {
          id: 2,
          name: "Push-ups",
          sets: 3,
          reps: "8-12",
          rest: "60 seconds",
          description: "Keep your body straight, lower chest to floor",
          equipment: "None",
        },
        {
          id: 3,
          name: "Plank",
          sets: 3,
          reps: "30-45 seconds",
          rest: "45 seconds",
          description: "Hold straight line from head to heels",
          equipment: "None",
        },
        {
          id: 4,
          name: "Lunges",
          sets: 3,
          reps: "10-12 each leg",
          rest: "60 seconds",
          description: "Step forward into a lunge, keep front knee over ankle",
          equipment: "None",
        },
        {
          id: 5,
          name: "Bird Dog",
          sets: 3,
          reps: "10-12 each side",
          rest: "45 seconds",
          description: "Kneel on all fours, extend opposite arm and leg",
          equipment: "None",
        },
      ],
      notes: "Focus on proper form. This workout is spine-friendly and safe for lower back pain.",
    },
    {
      id: 2,
      title: "Core & Stability - Home",
      day: "Day 2",
      duration: "35 minutes",
      difficulty: "Intermediate",
      exercises: [
        {
          id: 1,
          name: "Dead Bug",
          sets: 3,
          reps: "12 each side",
          rest: "45 seconds",
          description: "Lie on back, extend opposite arm and leg while keeping core engaged",
          equipment: "None",
        },
        {
          id: 2,
          name: "Cat-Cow Stretch",
          sets: 2,
          reps: "10-15",
          rest: "30 seconds",
          description: "Move between arching and rounding your back",
          equipment: "None",
        },
        {
          id: 3,
          name: "Side Plank",
          sets: 3,
          reps: "30-45 seconds each side",
          rest: "60 seconds",
          description: "Support body on one forearm and side of foot",
          equipment: "None",
        },
        {
          id: 4,
          name: "Glute Bridge",
          sets: 3,
          reps: "15-20",
          rest: "45 seconds",
          description: "Lift hips off ground, squeeze glutes at top",
          equipment: "None",
        },
        {
          id: 5,
          name: "Wall Sits",
          sets: 3,
          reps: "30-60 seconds",
          rest: "60 seconds",
          description: "Slide down wall until thighs parallel to floor",
          equipment: "Wall",
        },
      ],
      notes: "Excellent for strengthening the core and supporting the lower back.",
    },
    {
      id: 3,
      title: "Upper Body & Mobility - Home",
      day: "Day 3",
      duration: "40 minutes",
      difficulty: "Beginner",
      exercises: [
        {
          id: 1,
          name: "Wall Push-ups",
          sets: 3,
          reps: "12-15",
          rest: "45 seconds",
          description: "Stand facing wall, push away from wall",
          equipment: "Wall",
        },
        {
          id: 2,
          name: "Band Pull-Aparts",
          sets: 3,
          reps: "15-20",
          rest: "30 seconds",
          description: "Pull resistance band apart at chest level",
          equipment: "Resistance Band",
        },
        {
          id: 3,
          name: "Shoulder Blade Squeezes",
          sets: 3,
          reps: "15-20",
          rest: "30 seconds",
          description: "Squeeze shoulder blades together",
          equipment: "None",
        },
        {
          id: 4,
          name: "Doorway Stretch",
          sets: 2,
          reps: "30-45 seconds each side",
          rest: "30 seconds",
          description: "Place arm against doorway frame, lean forward",
          equipment: "Doorway",
        },
        {
          id: 5,
          name: "Tricep Dips (Chair)",
          sets: 3,
          reps: "8-12",
          rest: "60 seconds",
          description: "Use chair or bench for support",
          equipment: "Chair",
        },
      ],
      notes: "Focus on posture and shoulder mobility. Safe for spine issues.",
    },
  ];

  // Примеры тренировок для Gym Workout
  const gymWorkouts: Workout[] = [
    {
      id: 4,
      title: "Lower Body Strength - Gym",
      day: "Day 1",
      duration: "60 minutes",
      difficulty: "Intermediate",
      exercises: [
        {
          id: 1,
          name: "Goblet Squats",
          sets: 4,
          reps: "10-12",
          rest: "90 seconds",
          description: "Hold dumbbell at chest, squat down keeping back straight",
          equipment: "Dumbbell",
        },
        {
          id: 2,
          name: "Romanian Deadlifts (RDL)",
          sets: 4,
          reps: "10-12",
          rest: "90 seconds",
          description: "Hinge at hips, keep back neutral",
          equipment: "Barbell or Dumbbells",
        },
        {
          id: 3,
          name: "Bulgarian Split Squats",
          sets: 3,
          reps: "10-12 each leg",
          rest: "60 seconds",
          description: "Rear foot elevated on bench",
          equipment: "Dumbbells, Bench",
        },
        {
          id: 4,
          name: "Leg Press",
          sets: 3,
          reps: "12-15",
          rest: "60 seconds",
          description: "Safe alternative to heavy squats",
          equipment: "Leg Press Machine",
        },
        {
          id: 5,
          name: "Cable Hip Abduction",
          sets: 3,
          reps: "12-15 each side",
          rest: "45 seconds",
          description: "Strengthen glutes and hip stabilizers",
          equipment: "Cable Machine",
        },
      ],
      notes: "Spine-friendly lower body workout. Avoid heavy squats if experiencing back pain.",
    },
    {
      id: 5,
      title: "Upper Body Push - Gym",
      day: "Day 2",
      duration: "55 minutes",
      difficulty: "Intermediate",
      exercises: [
        {
          id: 1,
          name: "Incline Dumbbell Press",
          sets: 4,
          reps: "8-12",
          rest: "90 seconds",
          description: "Bench set to 30-45 degrees",
          equipment: "Dumbbells, Incline Bench",
        },
        {
          id: 2,
          name: "Cable Chest Fly",
          sets: 3,
          reps: "12-15",
          rest: "60 seconds",
          description: "Use cable machine, controlled movement",
          equipment: "Cable Machine",
        },
        {
          id: 3,
          name: "Seated Overhead Press",
          sets: 3,
          reps: "10-12",
          rest: "90 seconds",
          description: "Use back support, maintain neutral spine",
          equipment: "Dumbbells, Bench",
        },
        {
          id: 4,
          name: "Lateral Raises",
          sets: 3,
          reps: "12-15",
          rest: "45 seconds",
          description: "Raise arms to side, slightly bent elbows",
          equipment: "Dumbbells",
        },
        {
          id: 5,
          name: "Tricep Cable Extensions",
          sets: 3,
          reps: "12-15",
          rest: "45 seconds",
          description: "Use rope attachment",
          equipment: "Cable Machine",
        },
      ],
      notes: "Seated exercises reduce lower back stress.",
    },
    {
      id: 6,
      title: "Back & Core - Gym",
      day: "Day 3",
      duration: "50 minutes",
      difficulty: "Advanced",
      exercises: [
        {
          id: 1,
          name: "Lat Pulldown",
          sets: 4,
          reps: "10-12",
          rest: "90 seconds",
          description: "Wide grip, pull to chest",
          equipment: "Lat Pulldown Machine",
        },
        {
          id: 2,
          name: "Seated Cable Row",
          sets: 4,
          reps: "10-12",
          rest: "90 seconds",
          description: "Keep back straight, squeeze shoulder blades",
          equipment: "Cable Machine",
        },
        {
          id: 3,
          name: "Face Pulls",
          sets: 3,
          reps: "15-20",
          rest: "60 seconds",
          description: "Pull cable to face level, external rotation",
          equipment: "Cable Machine",
        },
        {
          id: 4,
          name: "Ab Wheel Rollout",
          sets: 3,
          reps: "8-12",
          rest: "60 seconds",
          description: "Kneeling position, roll out while keeping core engaged",
          equipment: "Ab Wheel",
        },
        {
          id: 5,
          name: "Pallof Press",
          sets: 3,
          reps: "10-12 each side",
          rest: "45 seconds",
          description: "Anti-rotation core exercise",
          equipment: "Cable Machine",
        },
      ],
      notes: "Strong back muscles support the spine. Focus on form over weight.",
    },
  ];

  // Получаем тип тренировки из localStorage
  const getWorkoutType = () => {
    const savedQuizzes = JSON.parse(localStorage.getItem("quizAnswers") || "[]");
    if (savedQuizzes.length > 0) {
      const latestQuiz = savedQuizzes[savedQuizzes.length - 1];
      return latestQuiz.workoutType || "home";
    }
    return "home";
  };

  const workoutType = getWorkoutType();
  const workouts = workoutType === "home" ? homeWorkouts : gymWorkouts;

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout);
  };

  const handleBackToList = () => {
    setSelectedWorkout(null);
  };

  if (selectedWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img
                  src={muscleIcon}
                  alt="SpineFit Logo"
                  className="w-10 h-10 object-contain"
                />
                <h1 className="text-2xl font-bold text-blue-700">SpineFit</h1>
              </div>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Workouts
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-800">
                  {selectedWorkout.title}
                </h2>
                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    selectedWorkout.difficulty === "Beginner"
                      ? "bg-green-100 text-green-800"
                      : selectedWorkout.difficulty === "Intermediate"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedWorkout.difficulty}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {selectedWorkout.day}
                </span>
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {selectedWorkout.duration}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {selectedWorkout.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mr-3">
                          Exercise {index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {exercise.name}
                        </h3>
                      </div>
                      {exercise.description && (
                        <p className="text-gray-600 mb-3">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Sets</p>
                      <p className="text-lg font-bold text-blue-700">
                        {exercise.sets}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Reps</p>
                      <p className="text-lg font-bold text-green-700">
                        {exercise.reps}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Rest</p>
                      <p className="text-lg font-bold text-orange-700">
                        {exercise.rest}
                      </p>
                    </div>
                  </div>
                  {exercise.equipment && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      Equipment: {exercise.equipment}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedWorkout.notes && (
              <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Notes:
                </p>
                <p className="text-yellow-700">{selectedWorkout.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src={muscleIcon}
                alt="SpineFit Logo"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold text-blue-700">SpineFit</h1>
            </div>
            <button
              onClick={onNavigateToHome}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Home
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Your Personalized Workout Plan
          </h2>
          <p className="text-lg text-gray-600">
            {workoutType === "home"
              ? "Home workouts tailored to your needs"
              : "Gym workouts designed for your goals"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              onClick={() => handleWorkoutClick(workout)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
            >
              <div
                className={`h-32 ${
                  workout.difficulty === "Beginner"
                    ? "bg-gradient-to-br from-green-400 to-emerald-600"
                    : workout.difficulty === "Intermediate"
                    ? "bg-gradient-to-br from-yellow-400 to-orange-600"
                    : "bg-gradient-to-br from-red-400 to-pink-600"
                } relative`}
              >
                <div className="absolute inset-0 bg-blue-600 bg-opacity-10 group-hover:bg-opacity-20 transition-opacity"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-xl font-bold">{workout.day}</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {workout.title}
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workout.difficulty === "Beginner"
                        ? "bg-green-100 text-green-800"
                        : workout.difficulty === "Intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {workout.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">
                    {workout.duration}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {workout.exercises.length} exercises
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                  View Details
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

