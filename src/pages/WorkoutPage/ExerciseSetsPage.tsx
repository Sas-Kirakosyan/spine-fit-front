import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "../../layout/PageContainer";
import type {
  ExerciseSetsPageProps,
  SetField,
  ExerciseSetRow,
} from "../../types/workout";
import { ExerciseSet } from "./ExerciseSet";
import {
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../constants/workout";
import { Button } from "../../components/Buttons/Button";

const toolbarButtons = [
  {
    id: "timer",
    label: "Rest timer",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M9 3h6" />
        <path d="M10 6h4" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    id: "plates",
    label: "Plate Calculator",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M7 12h10" />
        <path d="M12 7v10" />
      </svg>
    ),
  },
];

export function ExerciseSetsPage({
  exercise,
  onNavigateBack,
  onStartWorkoutSession,
  onMarkExerciseComplete,
  isDuringActiveWorkout = false,
}: ExerciseSetsPageProps) {
  const initialSetTemplate = useMemo(
    () => ({
      reps: exercise.reps ? String(exercise.reps) : "",
      weight: exercise.weight ? String(exercise.weight) : "",
      completed: false,
    }),
    [exercise.reps, exercise.weight]
  );

  const [restTimerEnabled, setRestTimerEnabled] = useState(false);
  const [sets, setSets] = useState<ExerciseSetRow[]>(() => {
    const count = Math.max(exercise.sets || 1, 1);
    return Array.from({ length: count }, () => ({ ...initialSetTemplate }));
  });
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [painLevel, setPainLevel] = useState(2);

  useEffect(() => {
    const count = Math.max(exercise.sets || 1, 1);
    setSets(Array.from({ length: count }, () => ({ ...initialSetTemplate })));
    setActiveSetIndex(0);
  }, [exercise, initialSetTemplate]);

  useEffect(() => {
    setActiveSetIndex((prev) => {
      if (prev === -1) {
        return prev;
      }
      return Math.min(prev, Math.max(sets.length - 1, 0));
    });
  }, [sets.length]);

  const findNextPendingIndex = (
    list: ExerciseSetRow[],
    startFrom = 0
  ): number => {
    for (let i = startFrom; i < list.length; i += 1) {
      if (!list[i].completed) {
        return i;
      }
    }
    return -1;
  };

  const handleActivateSet = (index: number) => {
    if (sets[index]?.completed) {
      return;
    }
    setActiveSetIndex(index);
  };

  const handleSetValueChange = (
    index: number,
    field: SetField,
    value: string
  ) => {
    if (sets[index]?.completed) {
      return;
    }
    setActiveSetIndex(index);
    setSets((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddSet = () => {
    setSets((prev) => {
      const next = [...prev, { ...initialSetTemplate }];
      if (activeSetIndex === -1) {
        setActiveSetIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleLogSet = () => {
    if (sets.length === 0 || sets.every((item) => item.completed)) {
      return;
    }
    const targetIndex =
      activeSetIndex >= 0 && activeSetIndex < sets.length ? activeSetIndex : -1;
    if (targetIndex === -1 || sets[targetIndex]?.completed) {
      return;
    }

    console.log("Logging set entries", sets[targetIndex]);

    setSets((prev) => {
      const updated = prev.map((item, index) =>
        index === targetIndex ? { ...item, completed: true } : item
      );
      const nextAfter = findNextPendingIndex(updated, targetIndex + 1);
      const fallback =
        nextAfter !== -1 ? nextAfter : findNextPendingIndex(updated, 0);
      setActiveSetIndex(fallback);
      return updated;
    });
  };

  const handleLogAllSets = () => {
    console.log("Logging all set entries", sets);
    setSets((prev) => prev.map((item) => ({ ...item, completed: true })));
    setActiveSetIndex(-1);
  };

  const handleCompleteExercise = () => {
    if (sets.length === 0) {
      return;
    }
    onMarkExerciseComplete?.(exercise.id);
    if (!onMarkExerciseComplete) {
      onStartWorkoutSession();
    }
  };

  const allSetsCompleted =
    sets.length > 0 && sets.every((setEntry) => setEntry.completed);
  const sliderProgress = ((painLevel - 1) / 9) * 100;
  const painFaces = [
    { id: 1, label: "🙂", value: 1 },
    { id: 2, label: "😊", value: 3 },
    { id: 3, label: "😐", value: 5 },
    { id: 4, label: "🙁", value: 7 },
    { id: 5, label: "😣", value: 9 },
  ];

  return (
    <PageContainer
      backgroundImage={`url(${exercise.image_url})`}
      overlayClassName="bg-[#080A14]/85"
      contentClassName="gap-6 rounded-[28px] bg-[#0E1224]/95 px-6 pb-10 pt-6 text-white"
      fallbackBackgroundClassName="bg-[#0E1224]"
    >
      <div className="flex flex-1 flex-col gap-6">
        <header className="relative overflow-hidden rounded-[26px] border border-white/12 bg-[#191E31] shadow-xl">
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="h-56 w-full object-cover brightness-[0.88]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1122] via-transparent to-black/40" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6">
            <button
              type="button"
              onClick={onNavigateBack}
              className={iconButtonClass}
              aria-label="back to workout"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                if (exercise.video_url) {
                  window.open(exercise.video_url, "_blank", "noopener");
                }
              }}
              className={`${primaryButtonClass} bg-blue-500 text-white shadow-lg`}
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 10l4.553-3.165A1 1 0 0 1 21 7.656v8.688a1 1 0 0 1-1.447.821L15 14z" />
                <rect x="3" y="6" width="12" height="12" rx="2" />
              </svg>
              How-To
            </button>
          </div>
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <h1 className="text-[28px] font-semibold text-white">
              {exercise.name}
            </h1>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          {toolbarButtons.map((item) => {
            const isTimer = item.id === "timer";
            const isActive = isTimer && restTimerEnabled;
            return (
              <button
                key={item.id}
                type="button"
                onClick={
                  isTimer
                    ? () => setRestTimerEnabled((prev) => !prev)
                    : undefined
                }
                className={`${secondaryButtonClass} ${
                  isActive
                    ? "border-blue-500/70 text-blue-300 shadow-inner shadow-blue-500/20"
                    : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/40 ${
                      isActive ? "text-blue-300" : "text-slate-200"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>
                    {item.label}
                    {isTimer ? `: ${restTimerEnabled ? "on" : "off"}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <section className="flex-1 rounded-[26px] border border-white/12 bg-[#13172A] p-3 shadow-xl ring-1 ring-white/5">
          <div className="space-y-3">
            {sets.map((setEntry, index) => (
              <ExerciseSet
                key={index}
                index={index}
                setEntry={setEntry}
                exercise={exercise}
                isActive={index === activeSetIndex}
                isCompleted={setEntry.completed}
                onActivate={handleActivateSet}
                onValueChange={handleSetValueChange}
              />
            ))}
            <button
              type="button"
              onClick={handleAddSet}
              className="ml-[6px] mt-9 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-rose-500"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-rose-500 bg-rose-500 text-black"
                style={{
                  clipPath:
                    "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v10" />
                  <path d="M3 8h10" />
                </svg>
              </span>
              Add Set
            </button>
          </div>
        </section>

        {allSetsCompleted && (
          <section className="rounded-[24px] border border-white/12 bg-[#161A30] p-5 shadow-inner shadow-white/5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                  Pain Level
                </span>
                <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {painLevel}
                </div>
              </div>
              <div className="flex items-center justify-between text-2xl">
                {painFaces.map((face) => (
                  <span
                    key={face.id}
                    className={`transition-opacity ${
                      Math.abs(face.value - painLevel) <= 1
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  >
                    {face.label}
                  </span>
                ))}
              </div>
              <div className="relative mt-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={painLevel}
                  onChange={(event) => setPainLevel(Number(event.target.value))}
                  className="h-2 w-full appearance-none rounded-full bg-white/10"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 ${sliderProgress}%, rgba(59,130,246,0.15) ${sliderProgress}%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-lg"
                  style={{
                    left: `calc(${sliderProgress}% - 14px)`,
                  }}
                >
                  {painLevel}
                </div>
                <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.32em] text-white/40">
                  <span>1</span>
                  <span>1-10</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {allSetsCompleted ? (
          <Button
            onClick={handleCompleteExercise}
            className="mr-[20px] ml-[20px] h-[44px] rounded-[12px] bg-emerald-500 text-base font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/30"
          >
            DONE
          </Button>
        ) : isDuringActiveWorkout ? (
          <div className="mr-[20px] ml-[20px] flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleLogAllSets}
              className="h-[40px] flex-1 rounded-[10px] bg-orange-500 text-white uppercase"
            >
              LOG ALL SETS
            </Button>
            <Button
              onClick={handleLogSet}
              className="h-[40px] flex-1 rounded-[10px] bg-red-500 text-white uppercase"
            >
              LOG SET
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStartWorkoutSession}
            className="mr-[20px] ml-[20px] h-[40px] rounded-[10px] bg-blue-600 text-white uppercase"
          >
            START Workout
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
