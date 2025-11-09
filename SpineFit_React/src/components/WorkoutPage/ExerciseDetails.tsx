import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Exercise } from "../../types/exercise";

interface ExerciseDetailsProps {
  exercise: Exercise;
  onClose: () => void;
}

const formatLabel = (value: string) =>
  value
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const detailPills = (exercise: Exercise) => [
  {
    label: "Difficulty",
    value: formatLabel(exercise.difficulty),
    color: "from-blue-500/70 to-blue-600/80",
  },
  {
    label: "Equipment",
    value: formatLabel(exercise.equipment),
    color: "from-emerald-500/70 to-emerald-600/80",
  },
  {
    label: "Primary Muscles",
    value: exercise.muscle_groups.map(formatLabel).join(", "),
    color: "from-purple-500/70 to-purple-600/80",
  },
];

export function ExerciseDetails({ exercise, onClose }: ExerciseDetailsProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-[#161827] text-slate-100 shadow-2xl ring-1 ring-white/10">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161827] via-transparent to-black/40" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-slate-200 transition hover:bg-black/70"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
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
          <div className="absolute bottom-6 left-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Technique Breakdown
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {exercise.name}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200/80">
              {exercise.description}
            </p>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {detailPills(exercise).map((pill) => (
              <div
                key={pill.label}
                className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/5"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {pill.label}
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {pill.value}
                </p>
                <div
                  className={`mt-3 h-1 rounded-full bg-gradient-to-r ${pill.color}`}
                />
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Instructions</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {exercise.instructions}
            </p>
          </section>

          <section className="space-y-4 rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                  exercise.is_back_friendly
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-rose-500/10 text-rose-300"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {exercise.is_back_friendly ? (
                    <>
                      <path d="M21 7l-9 9-5-5" />
                    </>
                  ) : (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  )}
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Back-Friendly Guidance
                </p>
                <p
                  className={`text-sm font-semibold ${
                    exercise.is_back_friendly
                      ? "text-emerald-200"
                      : "text-rose-200"
                  }`}
                >
                  {exercise.is_back_friendly
                    ? "Approved for most back issues"
                    : "Use with caution"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {exercise.back_issue_restrictions.map((restriction) => (
                <div
                  key={restriction.id}
                  className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    {formatLabel(restriction.issue_type)}
                  </p>
                  <p className="mt-2 text-sm text-amber-100/90">
                    Recommendation: {restriction.recommendation}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-amber-300/80">
                    Restriction level:{" "}
                    {formatLabel(restriction.restriction_level)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Ready to perform?
            </p>
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
