import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { PageContainer } from "../../layout/PageContainer";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import type { HistoryPageProps } from "../../types/pages";

const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function HistoryPage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  activePage,
  workouts,
}: HistoryPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const sortedWorkouts = [...workouts].sort(
    (a, b) =>
      new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  const filteredWorkouts = selectedDate
    ? sortedWorkouts.filter((workout) => {
        const workoutDate = new Date(workout.finishedAt);
        return isSameDay(workoutDate, selectedDate);
      })
    : sortedWorkouts;

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const years: number[] = [];
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(Number(e.target.value));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(Number(e.target.value));
    setCurrentMonth(newDate);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  return (
    <PageContainer contentClassName="gap-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[32px] font-semibold uppercase tracking-[0.4em] text-white">
            SpineFit
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">History</h1>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-5 rounded-[14px] bg-[#1B1E2B]/80 p-5 text-slate-100 shadow-xl ring-1 ring-white/5">
        <div className="rounded-[12px] border border-white/10 bg-[#111427]/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <select
                value={currentMonthIndex}
                onChange={handleMonthChange}
                className="bg-[#1B1E2B] border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="bg-[#1B1E2B] border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousMonth}
                className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-blue-600 transition-colors"
                aria-label="Previous month"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={handleNextMonth}
                className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-blue-600 transition-colors"
                aria-label="Next month"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            // navLayout="around"
            className="rounded-lg"
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-800/50 [&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-12 font-normal text-center aria-selected:opacity-100 text-white hover:bg-blue-600 rounded-md",
              day_selected:
                "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_outside:
                "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-800/50 aria-selected:text-slate-400 aria-selected:opacity-30",
              day_disabled: "text-slate-400 opacity-50",
              day_range_middle:
                "aria-selected:bg-slate-800 aria-selected:text-white",
              day_hidden: "invisible",
            }}
            modifiersClassNames={{
              selected: "bg-blue-600 text-white",
              today: "bg-blue-900 text-white font-semibold",
            }}
          />
        </div>

        <div className="flex flex-col gap-4">
          {filteredWorkouts.length === 0 ? (
            <div className="rounded-[12px] border border-white/10 bg-[#111427]/80 p-8 text-center">
              <p className="text-slate-400">
                {selectedDate
                  ? "No workouts on selected date"
                  : "No completed workouts"}
              </p>
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <article
                key={workout.id}
                className="rounded-[12px] border border-white/10 bg-[#111427]/80 p-5"
              >
                <div className="flex flex-wrap items-center justify-between text-sm text-white">
                  <span>{formatDateTime(workout.finishedAt)}</span>
                  <span className="font-semibold text-white">
                    Duration: {workout.duration}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-white sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Volume
                    </p>
                    <p className="text-lg font-semibold">
                      {workout.totalVolume.toLocaleString()} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Calories
                    </p>
                    <p className="text-lg font-semibold">
                      {workout.caloriesBurned} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Exercises
                    </p>
                    <p className="text-lg font-semibold">
                      {workout.exerciseCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Records
                    </p>
                    <p className="text-lg font-semibold">
                      {Object.keys(workout.completedExerciseLogs).length}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 flex flex-col gap-0.5">
                  {workout.completedExercises.map((exercise) => (
                    <li
                      key={`${workout.id}-${exercise.id}`}
                      className="rounded-[10px] border border-white/30 bg-[#15182A]/80 p-3"
                    >
                      <p className="text-sm font-semibold text-white">
                        {exercise.name}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>

      <BottomNav
        activePage={activePage}
        onWorkoutClick={onNavigateToWorkout}
        onProfileClick={onNavigateToProfile}
        onHistoryClick={onNavigateToHistory}
      />
    </PageContainer>
  );
}
