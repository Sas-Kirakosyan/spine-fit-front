import { useExerciseName } from "@spinefit/shared";
import { PageContainer } from "@/Layout/PageContainer";
import type { ExerciseDetailsProps } from "@/types/workout";
import { getExerciseImageUrl } from "@/utils/exercise";
import { getExerciseVideoUrl } from "@/lib/assets";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";

const formatLabel = (value: string) =>
  value
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

function ExerciseDetails({ exercise, onNavigateBack }: ExerciseDetailsProps) {
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onNavigateBack();
  };

  return (
    <PageContainer
      contentClassName="bg-[#161827] overflow-hidden ring-1 ring-white/10"
      minHeightClassName="min-h-[680px]"
    >
      <div className="flex h-full flex-col">
        {/* ── Video Section ── */}
        <div className="relative w-full bg-black aspect-video">
          <VideoPlayer
            src={getExerciseVideoUrl(exercise)}
            poster={getExerciseImageUrl(exercise)}
            className="absolute inset-0 h-full w-full"
          />

          <button
            type="button"
            onClick={handleBackClick}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-slate-200 backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-main/70"
            aria-label="back"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {name}
          </h2>

          <p className="text-sm leading-relaxed text-slate-400">
            {exercise.description}
          </p>

          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Target Muscles
            </span>
            <div className="flex flex-wrap gap-2">
              {exercise.muscle_groups.map((muscle) => (
                <span
                  key={muscle}
                  className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/5"
                >
                  {formatLabel(muscle)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default ExerciseDetails;
