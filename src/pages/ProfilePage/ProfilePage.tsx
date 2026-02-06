import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { PageContainer } from "@/Layout/PageContainer";
import type { ProfilePageProps } from "@/types/pages";
import { SettingsIcon } from "@/components/Icons/Icons";
import { Button } from "@/components/Buttons/Button";
import { StatsGrid } from "@/components/Progress/StatsGrid";
import { WeeklyActivity } from "@/components/Progress/WeeklyActivity";
import { ProgressChart } from "@/components/Progress/ProgressChart";
import { PersonalRecords } from "@/components/Progress/PersonalRecords";
import { ExerciseList } from "@/components/Progress/ExerciseList";
import {
  calculateTotalStats,
  getWeeklyActivity,
  getProgressData,
  getPersonalRecords,
  getWorkoutRecords,
  getAllExercisesWithProgress,
} from "@/utils/progressStats";

export function ProfilePage({
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToAI,
  onNavigateToSettings,
  activePage,
  workoutHistory,
}: ProfilePageProps) {
  const stats = useMemo(
    () => calculateTotalStats(workoutHistory),
    [workoutHistory]
  );

  const weeklyActivity = useMemo(
    () => getWeeklyActivity(workoutHistory),
    [workoutHistory]
  );

  const progressData = useMemo(
    () => getProgressData(workoutHistory),
    [workoutHistory]
  );

  const exerciseRecords = useMemo(
    () => getPersonalRecords(workoutHistory),
    [workoutHistory]
  );

  const workoutRecords = useMemo(
    () => getWorkoutRecords(workoutHistory),
    [workoutHistory]
  );

  const allExercises = useMemo(
    () => getAllExercisesWithProgress(workoutHistory),
    [workoutHistory]
  );

  const hasWorkouts = workoutHistory.length > 0;
  const [activeTab, setActiveTab] = useState<"overview" | "exercise">("overview");

  return (
    <PageContainer contentClassName="gap-5 pb-24 mx-2.5">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <h1 className="mx-2.5 text-3xl font-semibold text-white">
            Progress
          </h1>
        </div>
        <Button
          onClick={onNavigateToSettings}
          className="flex items-center gap-2 rounded-[14px] bg-white/10 mx-4 my-5"
        >
          <SettingsIcon />
        </Button>
      </header>

      {/* Tabs: Overview | Exercise */}
      <nav className="flex border-b border-white/10" aria-label="Progress sections">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "overview"
            ? "border-main text-white"
            : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("exercise")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "exercise"
            ? "border-main text-white"
            : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
        >
          Exercise
        </button>
      </nav>

      {activeTab === "overview" && (
        <>
          {hasWorkouts ? (
            <>
              <StatsGrid stats={stats} />
              <WeeklyActivity days={weeklyActivity} />
              <ProgressChart data={progressData} title="Volume progress" />
              <PersonalRecords
                exerciseRecords={exerciseRecords}
                workoutRecords={workoutRecords}
                maxItems={5}
                section="all"
              />
            </>
          ) : (
            <section className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center text-slate-100 shadow-xl ring-1 ring-white/5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-main/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-main"
                >
                  <path d="m6.5 6.5 11 11" />
                  <path d="m21 21-1-1" />
                  <path d="m3 3 1 1" />
                  <path d="m18 22 4-4" />
                  <path d="m2 6 4-4" />
                  <path d="m3 10 7-7" />
                  <path d="m14 21 7-7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Start training</h2>
              <p className="max-w-xs text-sm text-slate-400">
                Your progress, workout stats, personal records and charts will appear here after your first completed workout
              </p>
              <button
                onClick={onNavigateToWorkout}
                className="mt-4 rounded-xl bg-main px-6 py-3 font-semibold text-white transition-colors hover:bg-main/90 cursor-pointer"
              >
                Go to workout
              </button>
            </section>
          )}
        </>
      )}

      {activeTab === "exercise" && (
        <>
          {allExercises.length > 0 ? (
            <ExerciseList exercises={allExercises} />
          ) : (
            <div className="rounded-[14px] bg-[#1B1E2B]/80 p-8 text-center ring-1 ring-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 text-slate-600"
              >
                <path d="m6.5 6.5 11 11" />
                <path d="m21 21-1-1" />
                <path d="m3 3 1 1" />
                <path d="m18 22 4-4" />
                <path d="m2 6 4-4" />
                <path d="m3 10 7-7" />
                <path d="m14 21 7-7" />
              </svg>
              <p className="text-sm text-slate-400">
                Your estimated 1RM by exercise will appear here after completed workouts.
              </p>
            </div>
          )}
        </>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
          onAIClick={onNavigateToAI || (() => { })}
        />
      </div>
    </PageContainer>
  );
}
