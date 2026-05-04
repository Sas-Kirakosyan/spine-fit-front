import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DayPicker } from "react-day-picker";
import { ru, enUS } from "date-fns/locale";
import { addDays, format, isBefore, startOfWeek, type Locale } from "date-fns";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { PageContainer } from "@/Layout/PageContainer";
import type { HistoryPageProps } from "@/types/pages";
import { WorkoutHistoryList } from "@/pages/HistoryPage/WorkoutHistoryList";
import { Logo } from "@/components/Logo/Logo";
import { trackEvent } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import { isSameDay } from "@/utils/date";

type ViewMode = "week" | "month";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function HistoryPage({
  onNavigateToWorkout,
  onNavigateToProgress,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToAI,
  activePage,
  workouts,
}: HistoryPageProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("ru") ? ru : enUS;
  const auth = useAuth();

  useEffect(() => {
    trackEvent("workout_history_viewed", {
      history_entry_count: workouts.length,
    });
  }, []);

  const months = t("historyPage.navigation.months", {
    returnObjects: true,
  }) as string[];
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const registrationDate = (() => {
    if (auth.status !== "authenticated") return null;
    const createdAt = auth.user.created_at;
    if (!createdAt) return null;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  })();
  const registrationYear = registrationDate?.getFullYear();
  const registrationMonth = registrationDate?.getMonth();
  const registrationMonthStart = registrationDate
    ? new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1)
    : null;
  const isAtRegistrationMonth =
    registrationDate !== null &&
    currentYear === registrationYear &&
    currentMonthIndex === registrationMonth;

  const weekStart = useMemo(
    () => startOfWeek(currentMonth, { locale }),
    [currentMonth, locale]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const isAtRegistrationWeek =
    registrationDate !== null &&
    isBefore(addDays(weekStart, -1), registrationDate);

  const workoutDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const w of workouts) {
      const d = new Date(w.finishedAt);
      if (!Number.isNaN(d.getTime())) set.add(dayKey(d));
    }
    return set;
  }, [workouts]);

  const handlePrevious = () => {
    if (viewMode === "week") {
      if (isAtRegistrationWeek) return;
      setCurrentMonth(addDays(currentMonth, -7));
    } else {
      if (isAtRegistrationMonth) return;
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentMonth(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentMonth(addDays(currentMonth, 7));
    } else {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
    }
  };

  const isPrevDisabled =
    viewMode === "week" ? isAtRegistrationWeek : isAtRegistrationMonth;
  const prevLabel =
    viewMode === "week"
      ? t("historyPage.navigation.previousWeek")
      : t("historyPage.navigation.previousMonth");
  const nextLabel =
    viewMode === "week"
      ? t("historyPage.navigation.nextWeek")
      : t("historyPage.navigation.nextMonth");
  const toggleLabel =
    viewMode === "week"
      ? t("historyPage.navigation.expand")
      : t("historyPage.navigation.collapse");

  const calendarColClass =
    viewMode === "week" ? "" : "md:sticky md:top-4";
  const sectionGridClass =
    viewMode === "week"
      ? "md:grid md:grid-cols-1 md:gap-6"
      : "md:grid md:grid-cols-[40%_60%] md:gap-6 md:items-start";

  return (
    <PageContainer contentClassName="gap-8">
      <Logo />
      <section
        className={`flex flex-1 flex-col gap-5 rounded-[14px] bg-[#1B1E2B]/80 p-5 text-slate-100 shadow-xl ring-1 ring-white/5 ${sectionGridClass}`}
      >
        <div
          className={`rounded-[12px] border border-white/10 bg-[#111427]/80 p-4 ${calendarColClass}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">
              {months[currentMonthIndex]} {currentYear}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                disabled={isPrevDisabled}
                className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-main transition-colors disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label={prevLabel}
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
                onClick={handleNext}
                className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-main transition-colors"
                aria-label={nextLabel}
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
              <button
                onClick={() =>
                  setViewMode((m) => (m === "week" ? "month" : "week"))
                }
                className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-white flex items-center justify-center rounded-md hover:bg-main transition-colors"
                aria-label={toggleLabel}
                title={toggleLabel}
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
                  style={{
                    transform:
                      viewMode === "week" ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === "week" ? (
            <WeekStrip
              days={weekDays}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              workoutDateKeys={workoutDateKeys}
              registrationDate={registrationDate}
              locale={locale}
            />
          ) : (
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={locale}
              startMonth={registrationMonthStart ?? undefined}
              disabled={
                registrationDate ? { before: registrationDate } : undefined
              }
              modifiers={{
                hasWorkout: (d) => workoutDateKeys.has(dayKey(d)),
              }}
              className="rounded-lg capitalize"
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
                cell: "h-11 w-11 md:h-12 md:w-12 text-center text-sm relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-800/50 [&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-11 w-11 md:h-12 md:w-12 font-normal text-center aria-selected:opacity-100 text-white hover:bg-main rounded-md relative",
                day_selected:
                  "bg-main text-white hover:bg-main hover:text-white focus:bg-main focus:text-white",
                day_outside:
                  "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-800/50 aria-selected:text-slate-400 aria-selected:opacity-30",
                day_disabled: "text-slate-400 opacity-50",
                day_range_middle:
                  "aria-selected:bg-slate-800 aria-selected:text-white",
                day_hidden: "invisible",
              }}
              modifiersClassNames={{
                selected: "bg-main text-white",
                today: "bg-main/80 text-white font-semibold",
                hasWorkout:
                  "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-main",
              }}
            />
          )}
        </div>
        <WorkoutHistoryList workouts={workouts} selectedDate={selectedDate} />
      </section>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] md:max-w-none">
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProgressClick={onNavigateToProgress}
          onHistoryClick={onNavigateToHistory}
          onProfileClick={onNavigateToProfile}
          onAIClick={onNavigateToAI || (() => {})}
        />
      </div>
    </PageContainer>
  );
}

interface WeekStripProps {
  days: Date[];
  selectedDate: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  workoutDateKeys: Set<string>;
  registrationDate: Date | null;
  locale: Locale;
}

function WeekStrip({
  days,
  selectedDate,
  onSelect,
  workoutDateKeys,
  registrationDate,
  locale,
}: WeekStripProps) {
  const today = new Date();
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isToday = isSameDay(day, today);
        const isDisabled =
          registrationDate !== null && isBefore(day, registrationDate);
        const hasWorkout = workoutDateKeys.has(dayKey(day));

        const baseClass =
          "relative flex flex-col items-center justify-center gap-0.5 rounded-md py-2 text-white transition-colors";
        const stateClass = isDisabled
          ? "text-slate-400 opacity-40 cursor-not-allowed"
          : isSelected
            ? "bg-main text-white"
            : isToday
              ? "bg-main/80 text-white font-semibold hover:bg-main"
              : "hover:bg-main";

        return (
          <button
            key={day.toISOString()}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(isSelected ? undefined : day)}
            className={`${baseClass} ${stateClass}`}
            aria-pressed={isSelected}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              {format(day, "EEEEEE", { locale })}
            </span>
            <span className="text-base font-medium leading-none">
              {format(day, "d")}
            </span>
            {hasWorkout && !isSelected && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-main" />
            )}
            {hasWorkout && isSelected && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default HistoryPage;
