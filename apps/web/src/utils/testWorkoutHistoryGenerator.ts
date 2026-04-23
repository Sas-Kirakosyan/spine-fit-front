import type { GeneratedPlan, WorkoutDay } from "@spinefit/shared";
import type { FinishedWorkoutSummary } from "@/types/workout";
import type { ExerciseSetRow } from "@/types/workout";
import type { Exercise } from "@/types/exercise";
import { calculateWorkoutVolume } from "./workoutStats";
import { getPlan } from "@/lib/planService";

/**
 * Данные о прогрессии для упражнения
 */
interface ProgressionData {
  baseWeight: number;
  baseReps: number;
  currentWeight: number;
  currentReps: number;
  week: number;
}

/**
 * Рассчитывает прогрессию для упражнения на основе недели и дня
 */
function calculateProgression(
  exercise: Exercise,
  week: number,
  dayIndex: number,
  previousProgression?: ProgressionData
): ProgressionData {
  const isBodyweight =
    exercise.equipment === "bodyweight" ||
    exercise.equipment === "none" ||
    exercise.equipment === "";

  // Базовые значения из упражнения
  const originalWeight = exercise.weight || 0;
  const originalReps = exercise.reps || 10;

  // Если есть предыдущая прогрессия, используем её как базу (упражнение уже выполнялось)
  if (previousProgression) {
    // Для bodyweight упражнений увеличиваем только повторения
    if (isBodyweight) {
      const repsIncrease = 1; // +1 повторение каждую тренировку
      return {
        baseWeight: 0,
        baseReps: originalReps,
        currentWeight: 0,
        currentReps: previousProgression.currentReps + repsIncrease,
        week,
      };
    }

    // Для упражнений с весом: увеличиваем вес на 2.5 кг каждую тренировку
    // или повторения на 1, если вес уже высокий
    const weightIncrease = 2.5; // +2.5 кг каждую тренировку
    const newWeight = previousProgression.currentWeight + weightIncrease;
    
    // Если вес стал слишком большим относительно базовых повторений (более 20%), увеличиваем повторения вместо веса
    const weightIncreasePercent = originalWeight > 0 
      ? (newWeight - originalWeight) / originalWeight 
      : 0;
    const shouldIncreaseReps = weightIncreasePercent > 0.2 && previousProgression.currentReps < originalReps + 3;
    
    if (shouldIncreaseReps) {
      return {
        baseWeight: originalWeight,
        baseReps: originalReps,
        currentWeight: previousProgression.currentWeight,
        currentReps: previousProgression.currentReps + 1,
        week,
      };
    }

    return {
      baseWeight: originalWeight,
      baseReps: originalReps,
      currentWeight: newWeight,
      currentReps: previousProgression.currentReps,
      week,
    };
  }

  // Первое выполнение упражнения - используем базовые значения
  return {
    baseWeight: originalWeight,
    baseReps: originalReps,
    currentWeight: originalWeight,
    currentReps: originalReps,
    week: 1,
  };
}

/**
 * Создает логи сетов для упражнения на основе прогрессии
 */
function createExerciseLogs(
  exercise: Exercise,
  progression: ProgressionData
): ExerciseSetRow[] {
  const sets = exercise.sets || 3;
  const logs: ExerciseSetRow[] = [];

  for (let i = 0; i < sets; i++) {
    // Небольшая вариативность в повторениях (последний сет может быть на 1-2 повторения меньше)
    const repsVariation = i === sets - 1 ? -1 : 0;
    const finalReps = Math.max(1, progression.currentReps + repsVariation);

    logs.push({
      id: `set-${exercise.id}-${i}-${Date.now()}`,
      reps: String(finalReps),
      weight: String(progression.currentWeight),
      completed: true,
    });
  }

  return logs;
}

/**
 * Создает одну завершенную тренировку
 */
function createWorkoutSummary(
  day: WorkoutDay,
  date: Date,
  progressionMap: Map<number, ProgressionData>
): FinishedWorkoutSummary {
  const completedExerciseLogs: Record<number, ExerciseSetRow[]> = {};
  const completedExercises: Exercise[] = [];

  // Создаем логи для каждого упражнения
  for (const exercise of day.exercises) {
    const progression = progressionMap.get(exercise.id);
    if (!progression) continue;

    const logs = createExerciseLogs(exercise, progression);
    completedExerciseLogs[exercise.id] = logs;
    completedExercises.push(exercise);
  }

  // Рассчитываем метрики
  const totalVolume = calculateWorkoutVolume(
    completedExercises,
    completedExerciseLogs
  );

  // Длительность тренировки: 30-60 минут в зависимости от количества упражнений
  const baseDuration = 30;
  const additionalMinutes = completedExercises.length * 5;
  const totalMinutes = Math.min(baseDuration + additionalMinutes, 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:00`;

  // Калории: примерно 5-8 калорий на кг объема
  const caloriesBurned = Math.round(totalVolume * 0.006 + 100);

  return {
    id: `test-workout-${day.dayNumber}-${date.getTime()}`,
    finishedAt: date.toISOString(),
    duration,
    totalVolume: Math.round(totalVolume),
    exerciseCount: completedExercises.length,
    caloriesBurned,
    completedExercises,
    completedExerciseLogs,
  };
}

/**
 * Получает даты тренировок для 4-дневного плана
 * Расписание: Понедельник (0), Вторник (1), Четверг (3), Пятница (4)
 * В системе: 0 = понедельник, в JavaScript Date: 0 = воскресенье, 1 = понедельник
 */
function getWorkoutDates(
  startDate: Date,
  weeks: number
): { date: Date; dayIndex: number }[] {
  const dates: { date: Date; dayIndex: number }[] = [];
  const workoutDays = [0, 1, 3, 4]; // Mon, Tue, Thu, Fri (в системе, где 0 = понедельник)

  // Находим ближайший понедельник от startDate
  const baseDate = new Date(startDate);
  const currentDayOfWeek = baseDate.getDay(); // 0 = воскресенье, 1 = понедельник, ...
  // Преобразуем в нашу систему (0 = понедельник)
  const currentDayInSystem = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  
  // Находим ближайший понедельник (день 0 в нашей системе)
  const daysToMonday = currentDayInSystem === 0 ? 0 : -currentDayInSystem;
  baseDate.setDate(baseDate.getDate() + daysToMonday);
  baseDate.setHours(10, 0, 0, 0); // Устанавливаем время 10:00

  for (let week = 0; week < weeks; week++) {
    for (const dayIndex of workoutDays) {
      const date = new Date(baseDate);
      // Добавляем недели и дни
      date.setDate(date.getDate() + week * 7 + dayIndex);
      dates.push({ date, dayIndex });
    }
  }

  return dates;
}

/**
 * Генерирует тестовую историю тренировок на основе существующего плана
 * @param plan - План тренировок
 * @param weeks - Количество недель истории
 * @param startDate - Начальная дата (по умолчанию 4 недели назад от сегодня)
 */
export function generateTestWorkoutHistory(
  plan: GeneratedPlan,
  weeks: number = 4,
  startDate?: Date
): FinishedWorkoutSummary[] {
  if (!plan || !plan.workoutDays || plan.workoutDays.length === 0) {
    console.error("План не найден или не содержит тренировочных дней");
    return [];
  }

  // Если не указана начальная дата, начинаем с 4 недель назад
  const baseStartDate = startDate || new Date();
  if (!startDate) {
    baseStartDate.setDate(baseStartDate.getDate() - weeks * 7);
  }

  const workoutDates = getWorkoutDates(baseStartDate, weeks);
  const history: FinishedWorkoutSummary[] = [];
  const progressionMap = new Map<number, ProgressionData>();

  // Генерируем тренировки
  for (let i = 0; i < workoutDates.length; i++) {
    const { date, dayIndex } = workoutDates[i];
    const week = Math.floor(i / 4) + 1; // Неделя (1, 2, 3, 4...)

    // Выбираем день тренировки из плана
    // Для 4-дневного плана: день 0 -> план день 0, день 1 -> план день 1, день 3 -> план день 2, день 4 -> план день 3
    // Если в плане меньше дней, используем циклический выбор
    let planDayIndex = dayIndex;
    if (dayIndex === 3) {
      // Четверг -> используем день 2 из плана (если есть)
      planDayIndex = Math.min(2, plan.workoutDays.length - 1);
    } else if (dayIndex === 4) {
      // Пятница -> используем день 3 из плана (если есть)
      planDayIndex = Math.min(3, plan.workoutDays.length - 1);
    } else {
      // Понедельник и вторник -> дни 0 и 1
      planDayIndex = Math.min(dayIndex, plan.workoutDays.length - 1);
    }

    const planDay = plan.workoutDays[planDayIndex];

    if (!planDay || !planDay.exercises || planDay.exercises.length === 0) {
      continue;
    }

    // Обновляем прогрессию для каждого упражнения
    for (const exercise of planDay.exercises) {
      const previousProgression = progressionMap.get(exercise.id);
      const progression = calculateProgression(
        exercise,
        week,
        dayIndex,
        previousProgression
      );
      progressionMap.set(exercise.id, progression);
    }

    // Создаем тренировку
    const workout = createWorkoutSummary(planDay, date, progressionMap);
    history.push(workout);
  }

  return history;
}

/**
 * Сохраняет тестовую историю в localStorage
 */
export function saveTestWorkoutHistory(
  history: FinishedWorkoutSummary[]
): void {
  try {
    localStorage.setItem("workoutHistory", JSON.stringify(history));
    console.log(
      `✅ Сохранено ${history.length} тренировок в историю`,
      history
    );
  } catch (error) {
    console.error("Ошибка при сохранении истории тренировок:", error);
  }
}

/**
 * Генерирует и сохраняет тестовую историю тренировок
 * Можно вызвать из консоли браузера: generateAndSaveTestHistory(4)
 */
export function generateAndSaveTestHistory(weeks: number = 4): void {
  const plan = getPlan();
  if (!plan) {
    console.error(
      "❌ План не найден. Сначала создайте план тренировок в разделе 'My Plan'"
    );
    return;
  }

  console.log(`📅 Генерация тестовой истории на ${weeks} недель...`);
  const history = generateTestWorkoutHistory(plan, weeks);
  saveTestWorkoutHistory(history);
  console.log(
    `✅ Готово! Создано ${history.length} тренировок. Проверьте раздел 'History'`
  );
}

/**
 * Очищает тестовую историю тренировок
 */
export function clearTestWorkoutHistory(): void {
  try {
    localStorage.removeItem("workoutHistory");
    console.log("✅ История тренировок очищена");
  } catch (error) {
    console.error("Ошибка при очистке истории:", error);
  }
}

// Экспорт функций в window для использования из консоли браузера (только в development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).generateTestWorkoutHistory = generateAndSaveTestHistory;
  (window as any).clearTestWorkoutHistory = clearTestWorkoutHistory;
  console.log(
    "💡 Функции для тестирования доступны:\n" +
      "  - generateTestWorkoutHistory(weeks) - создать тестовую историю\n" +
      "  - clearTestWorkoutHistory() - очистить историю"
  );
}
