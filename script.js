// Global variables
let currentWorkout = null;
let workoutTimer = null;
let currentExerciseIndex = 0;
let isWorkoutPaused = false;
let workoutStartTime = null;

// Workout database
const workoutDatabase = {
    'back-safe': [
        {
            id: 'back-safe-1',
            name: 'Back-Safe Strength Training',
            description: 'A comprehensive workout designed specifically for people with back pain or injury concerns. Focuses on safe movements that strengthen without strain.',
            duration: 30,
            difficulty: 'Beginner',
            equipment: 'Bodyweight',
            category: 'back-safe',
            location: 'home',
            exercises: [
                {
                    name: 'Wall Slides',
                    description: 'Stand with your back against a wall, slide down into a squat position, hold for 3 seconds, slide back up. Keep your core engaged.',
                    duration: 60,
                    reps: '10-15',
                    safety: 'Keep your back flat against the wall. Stop if you feel any pain.'
                },
                {
                    name: 'Bird Dog',
                    description: 'Start on hands and knees. Extend opposite arm and leg, hold for 3 seconds, return to start. Alternate sides.',
                    duration: 60,
                    reps: '8-12 each side',
                    safety: 'Keep your core tight and back straight. Move slowly and controlled.'
                },
                {
                    name: 'Dead Bug',
                    description: 'Lie on your back, arms up, knees at 90 degrees. Lower one arm and opposite leg slowly, return to start.',
                    duration: 60,
                    reps: '8-12 each side',
                    safety: 'Keep your lower back pressed to the floor. Stop if you feel any strain.'
                },
                {
                    name: 'Glute Bridge',
                    description: 'Lie on your back, knees bent, feet flat. Lift your hips up, squeeze your glutes, hold for 2 seconds, lower slowly.',
                    duration: 60,
                    reps: '12-15',
                    safety: 'Keep your core engaged. Don\'t arch your back excessively.'
                },
                {
                    name: 'Plank (Modified)',
                    description: 'Start on forearms and knees. Keep your body straight from head to knees. Hold the position.',
                    duration: 30,
                    reps: 'Hold 30-60 seconds',
                    safety: 'Keep your core tight. If this is too difficult, try on your knees first.'
                }
            ]
        },
        {
            id: 'back-safe-2',
            name: 'Core Stability for Back Health',
            description: 'Strengthen your core muscles to support your spine and reduce back pain. All exercises are back-safe and gentle.',
            duration: 25,
            difficulty: 'Beginner',
            equipment: 'Bodyweight',
            category: 'back-safe',
            location: 'home',
            exercises: [
                {
                    name: 'Cat-Cow Stretch',
                    description: 'Start on hands and knees. Arch your back (cow), then round your back (cat). Move slowly and controlled.',
                    duration: 60,
                    reps: '8-10 cycles',
                    safety: 'Move slowly and gently. Stop if you feel any sharp pain.'
                },
                {
                    name: 'Side Plank (Modified)',
                    description: 'Lie on your side, prop up on your forearm. Lift your hips up, keep your body straight. Hold the position.',
                    duration: 30,
                    reps: 'Hold 20-30 seconds each side',
                    safety: 'Keep your core engaged. If too difficult, try with knees bent.'
                },
                {
                    name: 'Clamshells',
                    description: 'Lie on your side, knees bent. Keep your feet together, lift your top knee up, lower slowly.',
                    duration: 60,
                    reps: '12-15 each side',
                    safety: 'Keep your hips stacked. Don\'t let your top hip roll back.'
                },
                {
                    name: 'Pelvic Tilts',
                    description: 'Lie on your back, knees bent. Gently tilt your pelvis to flatten your lower back against the floor.',
                    duration: 60,
                    reps: '10-12',
                    safety: 'Move slowly and gently. This should be a small movement.'
                }
            ]
        }
    ],
    'core': [
        {
            id: 'core-1',
            name: 'Core Strength & Stability',
            description: 'Build a strong, stable core that supports your back and improves overall strength. Safe for all fitness levels.',
            duration: 35,
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            category: 'core',
            location: 'home',
            exercises: [
                {
                    name: 'Plank',
                    description: 'Start in push-up position, hold your body straight from head to heels. Keep your core tight.',
                    duration: 60,
                    reps: 'Hold 45-60 seconds',
                    safety: 'Keep your core engaged. Don\'t let your hips sag or pike up.'
                },
                {
                    name: 'Russian Twists',
                    description: 'Sit with knees bent, lean back slightly. Rotate your torso side to side, keeping your core engaged.',
                    duration: 60,
                    reps: '20-30 total',
                    safety: 'Keep your back straight. Don\'t strain your neck.'
                },
                {
                    name: 'Mountain Climbers',
                    description: 'Start in plank position. Bring one knee to your chest, quickly switch legs. Keep your core tight.',
                    duration: 60,
                    reps: '20-30 total',
                    safety: 'Keep your core engaged throughout. Move at a controlled pace.'
                },
                {
                    name: 'Bicycle Crunches',
                    description: 'Lie on your back, hands behind head. Bring one knee to chest while rotating opposite elbow to knee.',
                    duration: 60,
                    reps: '20-30 total',
                    safety: 'Don\'t pull on your neck. Keep your lower back pressed to floor.'
                }
            ]
        }
    ],
    'flexibility': [
        {
            id: 'flexibility-1',
            name: 'Flexibility & Recovery',
            description: 'Gentle stretching and mobility work to improve flexibility, reduce tension, and aid recovery.',
            duration: 20,
            difficulty: 'Beginner',
            equipment: 'Bodyweight',
            category: 'flexibility',
            location: 'home',
            exercises: [
                {
                    name: 'Child\'s Pose',
                    description: 'Kneel on the floor, sit back on your heels, reach your arms forward. Hold and breathe deeply.',
                    duration: 60,
                    reps: 'Hold 60-90 seconds',
                    safety: 'Breathe deeply and relax. Don\'t force the stretch.'
                },
                {
                    name: 'Cat-Cow Stretch',
                    description: 'Start on hands and knees. Arch your back (cow), then round your back (cat). Move slowly.',
                    duration: 60,
                    reps: '8-10 cycles',
                    safety: 'Move slowly and gently. Focus on the movement, not the depth.'
                },
                {
                    name: 'Hip Flexor Stretch',
                    description: 'Step one foot forward into a lunge position. Keep your back leg straight, feel the stretch in your hip.',
                    duration: 60,
                    reps: 'Hold 30-45 seconds each side',
                    safety: 'Keep your front knee over your ankle. Don\'t let it cave inward.'
                },
                {
                    name: 'Spinal Twist',
                    description: 'Lie on your back, arms out to sides. Drop both knees to one side, hold, then switch sides.',
                    duration: 60,
                    reps: 'Hold 30-45 seconds each side',
                    safety: 'Keep your shoulders on the floor. Don\'t force the twist.'
                }
            ]
        }
    ],
    'home': [
        {
            id: 'home-1',
            name: 'Home Strength Training',
            description: 'Full-body strength workout using only bodyweight exercises. Perfect for home training without equipment.',
            duration: 40,
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            category: 'home',
            location: 'home',
            exercises: [
                {
                    name: 'Push-ups',
                    description: 'Start in plank position, lower your chest to the floor, push back up. Keep your core tight.',
                    duration: 60,
                    reps: '8-15',
                    safety: 'Keep your body straight. If too difficult, try on your knees first.'
                },
                {
                    name: 'Squats',
                    description: 'Stand with feet shoulder-width apart. Lower down as if sitting in a chair, stand back up.',
                    duration: 60,
                    reps: '12-20',
                    safety: 'Keep your knees over your toes. Don\'t let them cave inward.'
                },
                {
                    name: 'Lunges',
                    description: 'Step one foot forward into a lunge, lower down, push back up. Alternate legs.',
                    duration: 60,
                    reps: '10-15 each leg',
                    safety: 'Keep your front knee over your ankle. Don\'t let it go past your toes.'
                },
                {
                    name: 'Plank',
                    description: 'Start in push-up position, hold your body straight from head to heels.',
                    duration: 60,
                    reps: 'Hold 30-60 seconds',
                    safety: 'Keep your core engaged. Don\'t let your hips sag.'
                }
            ]
        }
    ],
    'gym': [
        {
            id: 'gym-1',
            name: 'Gym Strength Training',
            description: 'Comprehensive gym workout using weights and machines. Focus on proper form and progressive overload.',
            duration: 45,
            difficulty: 'Intermediate',
            equipment: 'Weights & Machines',
            category: 'gym',
            location: 'gym',
            exercises: [
                {
                    name: 'Deadlifts',
                    description: 'Stand with feet hip-width apart, hold a barbell. Hinge at hips, lower bar to shins, stand back up.',
                    duration: 60,
                    reps: '8-12',
                    safety: 'Keep your back straight. Start with light weight. Don\'t round your back.'
                },
                {
                    name: 'Bench Press',
                    description: 'Lie on bench, hold barbell over chest. Lower to chest, press back up. Keep your core tight.',
                    duration: 60,
                    reps: '8-12',
                    safety: 'Use a spotter. Don\'t bounce the bar off your chest.'
                },
                {
                    name: 'Squats',
                    description: 'Stand with feet shoulder-width apart, hold barbell on shoulders. Lower down, stand back up.',
                    duration: 60,
                    reps: '8-12',
                    safety: 'Keep your knees over your toes. Don\'t let them cave inward.'
                },
                {
                    name: 'Rows',
                    description: 'Bend over, hold dumbbells. Pull weights to your sides, squeeze shoulder blades together.',
                    duration: 60,
                    reps: '10-15',
                    safety: 'Keep your back straight. Don\'t use momentum.'
                }
            ]
        }
    ]
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupWorkoutFilters();
    loadWorkouts();
    loadProgress();
    setupMobileMenu();
    loadProfile();
    loadAchievements();
    loadGoals();
}

// Navigation functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });

    // Load section-specific content
    if (sectionId === 'workouts') {
        loadWorkouts();
    } else if (sectionId === 'progress') {
        loadProgress();
    } else if (sectionId === 'profile') {
        loadProfile();
        loadAchievements();
        loadGoals();
    }
}

// Mobile menu setup
function setupMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

// Workout functions
function setupWorkoutFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active filter
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter workouts
            const filter = this.getAttribute('data-filter');
            filterWorkouts(filter);
        });
    });
}

function loadWorkouts() {
    const workoutList = document.getElementById('workoutList');
    if (!workoutList) return;

    // Get all workouts
    let allWorkouts = [];
    Object.values(workoutDatabase).forEach(category => {
        allWorkouts = allWorkouts.concat(category);
    });

    // Display workouts
    displayWorkouts(allWorkouts);
}

function filterWorkouts(filter) {
    const workoutList = document.getElementById('workoutList');
    if (!workoutList) return;

    let filteredWorkouts = [];
    
    if (filter === 'all') {
        Object.values(workoutDatabase).forEach(category => {
            filteredWorkouts = filteredWorkouts.concat(category);
        });
    } else {
        Object.values(workoutDatabase).forEach(category => {
            const categoryWorkouts = category.filter(workout => 
                workout.category === filter || workout.location === filter
            );
            filteredWorkouts = filteredWorkouts.concat(categoryWorkouts);
        });
    }

    displayWorkouts(filteredWorkouts);
}

function displayWorkouts(workouts) {
    const workoutList = document.getElementById('workoutList');
    if (!workoutList) return;

    workoutList.innerHTML = '';

    workouts.forEach(workout => {
        const workoutElement = document.createElement('div');
        workoutElement.className = 'workout-item';
        workoutElement.onclick = () => showWorkoutModal(workout);

        workoutElement.innerHTML = `
            <h3>${workout.name}</h3>
            <p>${workout.description}</p>
            <div class="workout-meta">
                <span><i class="fas fa-clock"></i> ${workout.duration} min</span>
                <span><i class="fas fa-signal"></i> ${workout.difficulty}</span>
                <span><i class="fas fa-dumbbell"></i> ${workout.equipment}</span>
            </div>
        `;

        workoutList.appendChild(workoutElement);
    });
}

function showWorkoutModal(workout) {
    currentWorkout = workout;
    const modal = document.getElementById('workoutModal');
    const modalTitle = document.getElementById('modalTitle');
    const workoutDuration = document.getElementById('workoutDuration');
    const workoutDifficulty = document.getElementById('workoutDifficulty');
    const workoutEquipment = document.getElementById('workoutEquipment');
    const workoutDescription = document.getElementById('workoutDescription');
    const exerciseList = document.getElementById('exerciseList');

    if (modal && modalTitle && workoutDuration && workoutDifficulty && workoutEquipment && workoutDescription && exerciseList) {
        modalTitle.textContent = workout.name;
        workoutDuration.textContent = workout.duration;
        workoutDifficulty.textContent = workout.difficulty;
        workoutEquipment.textContent = workout.equipment;
        workoutDescription.textContent = workout.description;

        // Display exercises
        exerciseList.innerHTML = '';
        workout.exercises.forEach((exercise, index) => {
            const exerciseElement = document.createElement('div');
            exerciseElement.className = 'exercise-item';
            exerciseElement.innerHTML = `
                <i class="fas fa-dumbbell"></i>
                <div class="exercise-info">
                    <h4>${exercise.name}</h4>
                    <p>${exercise.description}</p>
                    <small><strong>Safety:</strong> ${exercise.safety}</small>
                </div>
            `;
            exerciseList.appendChild(exerciseElement);
        });

        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function startWorkout() {
    if (!currentWorkout) return;

    closeModal();
    
    // Show timer modal
    const timerModal = document.getElementById('timerModal');
    const timerTitle = document.getElementById('timerTitle');
    const currentExercise = document.getElementById('currentExercise');
    const timerDisplay = document.getElementById('timerDisplay');
    const progressFill = document.getElementById('progressFill');
    const exerciseProgress = document.getElementById('exerciseProgress');

    if (timerModal && timerTitle && currentExercise && timerDisplay && progressFill && exerciseProgress) {
        timerTitle.textContent = currentWorkout.name;
        currentExerciseIndex = 0;
        workoutStartTime = Date.now();
        isWorkoutPaused = false;

        // Start the workout
        startExerciseTimer();
        timerModal.style.display = 'block';
    }
}

function startExerciseTimer() {
    if (!currentWorkout || currentExerciseIndex >= currentWorkout.exercises.length) {
        completeWorkout();
        return;
    }

    const exercise = currentWorkout.exercises[currentExerciseIndex];
    const currentExercise = document.getElementById('currentExercise');
    const timerDisplay = document.getElementById('timerDisplay');
    const progressFill = document.getElementById('progressFill');
    const exerciseProgress = document.getElementById('exerciseProgress');

    if (currentExercise && timerDisplay && progressFill && exerciseProgress) {
        currentExercise.innerHTML = `
            <h3>${exercise.name}</h3>
            <p>${exercise.description}</p>
            <small><strong>Safety:</strong> ${exercise.safety}</small>
        `;

        exerciseProgress.textContent = `Exercise ${currentExerciseIndex + 1} of ${currentWorkout.exercises.length}`;
        
        // Start timer
        let timeLeft = exercise.duration;
        updateTimerDisplay(timeLeft);
        
        workoutTimer = setInterval(() => {
            if (!isWorkoutPaused) {
                timeLeft--;
                updateTimerDisplay(timeLeft);
                
                // Update progress bar
                const progress = ((exercise.duration - timeLeft) / exercise.duration) * 100;
                progressFill.style.width = `${progress}%`;

                if (timeLeft <= 0) {
                    clearInterval(workoutTimer);
                    nextExercise();
                }
            }
        }, 1000);
    }
}

function updateTimerDisplay(seconds) {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

function nextExercise() {
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }
    
    currentExerciseIndex++;
    startExerciseTimer();
}

function pauseWorkout() {
    isWorkoutPaused = !isWorkoutPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = isWorkoutPaused ? 'Resume' : 'Pause';
    }
}

function stopWorkout() {
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }
    
    const timerModal = document.getElementById('timerModal');
    if (timerModal) {
        timerModal.style.display = 'none';
    }
    
    // Reset workout state
    currentWorkout = null;
    currentExerciseIndex = 0;
    isWorkoutPaused = false;
    workoutStartTime = null;
}

function completeWorkout() {
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }

    // Save workout to history
    saveWorkoutToHistory();

    // Show completion message
    alert('Workout completed! Great job! 🎉');

    // Close timer modal
    const timerModal = document.getElementById('timerModal');
    if (timerModal) {
        timerModal.style.display = 'none';
    }

    // Reset workout state
    currentWorkout = null;
    currentExerciseIndex = 0;
    isWorkoutPaused = false;
    workoutStartTime = null;

    // Update progress
    loadProgress();
}

function saveWorkoutToHistory() {
    if (!currentWorkout || !workoutStartTime) return;

    const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    const workoutDuration = Math.floor((Date.now() - workoutStartTime) / 60000); // in minutes

    const workoutRecord = {
        id: Date.now(),
        name: currentWorkout.name,
        date: new Date().toISOString(),
        duration: workoutDuration,
        exercises: currentWorkout.exercises.length
    };

    workoutHistory.unshift(workoutRecord);
    
    // Keep only last 20 workouts
    if (workoutHistory.length > 20) {
        workoutHistory.splice(20);
    }

    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
}

// Progress functions
function loadProgress() {
    loadProgressStats();
    loadWorkoutHistory();
}

function loadProgressStats() {
    const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    
    const workoutsCompleted = workoutHistory.length;
    const totalTime = workoutHistory.reduce((total, workout) => total + workout.duration, 0);
    const caloriesBurned = Math.round(totalTime * 8); // Rough estimate: 8 calories per minute

    const workoutsCompletedEl = document.getElementById('workoutsCompleted');
    const totalTimeEl = document.getElementById('totalTime');
    const caloriesBurnedEl = document.getElementById('caloriesBurned');

    if (workoutsCompletedEl) workoutsCompletedEl.textContent = workoutsCompleted;
    if (totalTimeEl) totalTimeEl.textContent = `${totalTime} min`;
    if (caloriesBurnedEl) caloriesBurnedEl.textContent = caloriesBurned;
}

function loadWorkoutHistory() {
    const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    const workoutHistoryEl = document.getElementById('workoutHistory');

    if (!workoutHistoryEl) return;

    if (workoutHistory.length === 0) {
        workoutHistoryEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No workouts completed yet. Start your first workout!</p>';
        return;
    }

    workoutHistoryEl.innerHTML = '';
    workoutHistory.slice(0, 10).forEach(workout => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const workoutDate = new Date(workout.date);
        const formattedDate = workoutDate.toLocaleDateString();
        
        historyItem.innerHTML = `
            <div class="history-item-info">
                <h4>${workout.name}</h4>
                <p>${workout.exercises} exercises • ${workout.duration} minutes</p>
            </div>
            <div class="history-item-date">${formattedDate}</div>
        `;
        
        workoutHistoryEl.appendChild(historyItem);
    });
}

// Quick workout selection
function selectWorkout(category) {
    showSection('workouts');
    
    // Filter to the selected category
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === category) {
            btn.classList.add('active');
        }
    });
    
    filterWorkouts(category);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const workoutModal = document.getElementById('workoutModal');
    const timerModal = document.getElementById('timerModal');
    
    if (event.target === workoutModal) {
        closeModal();
    }
    
    if (event.target === timerModal) {
        stopWorkout();
    }
});

// Profile functions
function loadProfile() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // Update profile display
    const userNameEl = document.getElementById('userName');
    const userLevelEl = document.getElementById('userLevel');
    const userGoalsEl = document.getElementById('userGoals');
    
    if (userNameEl) userNameEl.textContent = userProfile.name || 'Fitness Enthusiast';
    if (userLevelEl) userLevelEl.textContent = userProfile.fitnessLevel || 'Beginner';
    if (userGoalsEl) userGoalsEl.textContent = userProfile.primaryGoal || 'Building strength safely';
    
    // Update form inputs
    const userNameInput = document.getElementById('userNameInput');
    const fitnessLevel = document.getElementById('fitnessLevel');
    const primaryGoal = document.getElementById('primaryGoal');
    const workoutFrequency = document.getElementById('workoutFrequency');
    
    if (userNameInput) userNameInput.value = userProfile.name || '';
    if (fitnessLevel) fitnessLevel.value = userProfile.fitnessLevel || 'beginner';
    if (primaryGoal) primaryGoal.value = userProfile.primaryGoal || 'strength';
    if (workoutFrequency) workoutFrequency.value = userProfile.workoutFrequency || '2-3';
    
    // Update injury concerns checkboxes
    if (userProfile.injuryConcerns) {
        userProfile.injuryConcerns.forEach(concern => {
            const checkbox = document.getElementById(concern);
            if (checkbox) checkbox.checked = true;
        });
    }
}

function saveProfile() {
    const userProfile = {
        name: document.getElementById('userNameInput').value,
        fitnessLevel: document.getElementById('fitnessLevel').value,
        primaryGoal: document.getElementById('primaryGoal').value,
        workoutFrequency: document.getElementById('workoutFrequency').value,
        injuryConcerns: []
    };
    
    // Get injury concerns
    const injuryCheckboxes = ['backPain', 'kneeIssues', 'shoulderProblems', 'none'];
    injuryCheckboxes.forEach(concern => {
        const checkbox = document.getElementById(concern);
        if (checkbox && checkbox.checked) {
            userProfile.injuryConcerns.push(concern);
        }
    });
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Update display
    loadProfile();
    
    // Show success message
    alert('Profile saved successfully!');
}

// Achievement system
const achievements = [
    {
        id: 'first_workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        icon: 'fas fa-star',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            return workoutHistory.length >= 1;
        }
    },
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Complete 7 workouts',
        icon: 'fas fa-calendar-week',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            return workoutHistory.length >= 7;
        }
    },
    {
        id: 'month_master',
        name: 'Month Master',
        description: 'Complete 20 workouts',
        icon: 'fas fa-calendar-alt',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            return workoutHistory.length >= 20;
        }
    },
    {
        id: 'back_safe',
        name: 'Back Safe',
        description: 'Complete 5 back-safe workouts',
        icon: 'fas fa-shield-alt',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            const backSafeWorkouts = workoutHistory.filter(workout => 
                workout.name.toLowerCase().includes('back-safe') || 
                workout.name.toLowerCase().includes('core stability')
            );
            return backSafeWorkouts.length >= 5;
        }
    },
    {
        id: 'flexibility_fan',
        name: 'Flexibility Fan',
        description: 'Complete 3 flexibility workouts',
        icon: 'fas fa-leaf',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            const flexibilityWorkouts = workoutHistory.filter(workout => 
                workout.name.toLowerCase().includes('flexibility') || 
                workout.name.toLowerCase().includes('recovery')
            );
            return flexibilityWorkouts.length >= 3;
        }
    },
    {
        id: 'home_hero',
        name: 'Home Hero',
        description: 'Complete 10 home workouts',
        icon: 'fas fa-home',
        condition: (profile) => {
            const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            const homeWorkouts = workoutHistory.filter(workout => 
                workout.name.toLowerCase().includes('home') || 
                workout.name.toLowerCase().includes('bodyweight')
            );
            return homeWorkouts.length >= 10;
        }
    }
];

function loadAchievements() {
    const achievementGrid = document.getElementById('achievementGrid');
    if (!achievementGrid) return;
    
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const earnedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
    
    achievementGrid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const isEarned = earnedAchievements.includes(achievement.id) || achievement.condition(userProfile);
        
        if (isEarned && !earnedAchievements.includes(achievement.id)) {
            earnedAchievements.push(achievement.id);
            localStorage.setItem('earnedAchievements', JSON.stringify(earnedAchievements));
        }
        
        const achievementEl = document.createElement('div');
        achievementEl.className = `achievement-item ${isEarned ? 'earned' : ''}`;
        achievementEl.innerHTML = `
            <i class="${achievement.icon}"></i>
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        `;
        
        achievementGrid.appendChild(achievementEl);
    });
}

// Goals system
function loadGoals() {
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;
    
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    
    goalsList.innerHTML = '';
    
    if (goals.length === 0) {
        goalsList.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">No goals set yet. Add your first goal!</p>';
        return;
    }
    
    goals.forEach((goal, index) => {
        const goalEl = document.createElement('div');
        goalEl.className = `goal-item ${goal.completed ? 'completed' : ''}`;
        goalEl.innerHTML = `
            <span class="goal-text">${goal.text}</span>
            <div class="goal-actions">
                <button class="goal-btn complete" onclick="toggleGoal(${index})">
                    ${goal.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="goal-btn delete" onclick="deleteGoal(${index})">Delete</button>
            </div>
        `;
        
        goalsList.appendChild(goalEl);
    });
}

function addGoal() {
    const newGoalInput = document.getElementById('newGoal');
    const goalText = newGoalInput.value.trim();
    
    if (!goalText) {
        alert('Please enter a goal!');
        return;
    }
    
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    goals.push({
        text: goalText,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('userGoals', JSON.stringify(goals));
    newGoalInput.value = '';
    loadGoals();
}

function toggleGoal(index) {
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    goals[index].completed = !goals[index].completed;
    localStorage.setItem('userGoals', JSON.stringify(goals));
    loadGoals();
}

function deleteGoal(index) {
    if (confirm('Are you sure you want to delete this goal?')) {
        const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
        goals.splice(index, 1);
        localStorage.setItem('userGoals', JSON.stringify(goals));
        loadGoals();
    }
}

// Prevent body scroll when modal is open
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('show', function() {
            document.body.style.overflow = 'hidden';
        });
        
        modal.addEventListener('hide', function() {
            document.body.style.overflow = 'auto';
        });
    });
});
