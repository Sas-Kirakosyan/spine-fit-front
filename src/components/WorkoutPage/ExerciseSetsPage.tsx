import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "../../Layout/PageContainer";
import type { Exercise } from "../../types/exercise";

interface ExerciseSetsPageProps {
  exercise: Exercise;
  onNavigateBack: () => void;
}

type SetField = "reps" | "weight";

interface ExerciseSetRow {
  reps: string;
  weight: string;
}

const primaryButtonClass =
  "flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

const secondaryButtonClass =
  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1C2134]/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200 transition hover:border-white/20 hover:bg-[#242A40] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40";

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-slate-100 shadow-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

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
}: ExerciseSetsPageProps) {
  const initialSetTemplate = useMemo(
    () => ({
      reps: exercise.reps ? String(exercise.reps) : "",
      weight: exercise.weight ? String(exercise.weight) : "",
    }),
    [exercise.reps, exercise.weight]
  );

  const [restTimerEnabled, setRestTimerEnabled] = useState(false);
  const [sets, setSets] = useState<ExerciseSetRow[]>(() => {
    const count = Math.max(exercise.sets || 1, 1);
    return Array.from({ length: count }, () => ({ ...initialSetTemplate }));
  });

  useEffect(() => {
    const count = Math.max(exercise.sets || 1, 1);
    setSets(Array.from({ length: count }, () => ({ ...initialSetTemplate })));
  }, [exercise, initialSetTemplate]);

  const handleSetValueChange = (
    index: number,
    field: SetField,
    value: string
  ) => {
    setSets((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddSet = () => {
    setSets((prev) => [...prev, { ...initialSetTemplate }]);
  };

  const activeSetIndex = 0;

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
            {sets.map((setEntry, index) => {
              const isActive = index === activeSetIndex;
              return (
                <div key={`exercise-set-${index}`} className="flex gap-4">
                  <div className="flex justify-center w-10 flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center border-[1px] text-[16px] font-semibold text-[#000000] justify-center items-center ${
                        isActive
                          ? "border-[#000000] bg-[#ffffff]"
                          : "border-[#A9A9A9] bg-[#A9A9A9]"
                      }`}
                      style={{
                        clipPath:
                          "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                      }}
                    >
                      {index + 1}
                    </div>
                    {index !== sets.length && (
                      <div className="absolute mt-28 border-l h-[86px] border-white" />
                    )}
                  </div>
                  <div
                    className={`flex flex-1 flex-col gap-4 rounded-[22px] border px-4 py-3 shadow-inner ${
                      isActive
                        ? "border-white/40 bg-[#171C34]"
                        : "border-white/6 bg-[#101326]/80"
                    }`}
                  >
                    {isActive ? (
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2 text-left">
                          <span className="relative text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300">
                            Reps
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={setEntry.reps}
                            onChange={(event) =>
                              handleSetValueChange(
                                index,
                                "reps",
                                event.target.value
                              )
                            }
                            className="h-12 rounded-[18px] border border-white/80 bg-transparent px-5 text-lg font-semibold text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-left">
                          <span className="relative text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300">
                            Weight{" "}
                            {exercise.weight_unit ? (
                              <span className="text-[10px] uppercase text-slate-400">
                                ({exercise.weight_unit})
                              </span>
                            ) : null}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={setEntry.weight}
                            onChange={(event) =>
                              handleSetValueChange(
                                index,
                                "weight",
                                event.target.value
                              )
                            }
                            className="h-12 rounded-[18px] border border-white/80 bg-transparent px-5 text-lg font-semibold text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2 text-left">
                            <span className="relative text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                              Reps
                            </span>
                            <div className="flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-lg font-semibold text-white/35">
                              {setEntry.reps || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 text-left">
                            <span className="relative text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                              Weight{" "}
                              {exercise.weight_unit ? (
                                <span className="text-[10px] uppercase text-slate-500">
                                  ({exercise.weight_unit})
                                </span>
                              ) : null}
                            </span>
                            <div className="flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-lg font-semibold text-white/35">
                              {setEntry.weight || "—"}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
      </div>
    </PageContainer>
  );
}
