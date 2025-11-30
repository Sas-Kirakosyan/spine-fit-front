interface AllExercisePageHeaderProps {
  onClose: () => void;
  onToggleSearch: () => void;
  onToggleFilter?: () => void;
}

export function AllExercisePageHeader({
  onClose,
  onToggleSearch,
  onToggleFilter,
}: AllExercisePageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 text-red-500 hover:opacity-80 transition-opacity"
        aria-label="Закрыть"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h1 className="flex-1 text-xl font-semibold text-white">
        Add an exercise
      </h1>

      <div className="flex items-center gap-2">
        {onToggleFilter && (
          <button
            onClick={onToggleFilter}
            className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Фильтр"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="6" cy="5" r="2" />
              <line
                x1="2"
                y1="5"
                x2="22"
                y2="5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="2" />
              <line
                x1="2"
                y1="12"
                x2="22"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="18" cy="19" r="2" />
              <line
                x1="2"
                y1="19"
                x2="22"
                y2="19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <button
          onClick={onToggleSearch}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Поиск"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

