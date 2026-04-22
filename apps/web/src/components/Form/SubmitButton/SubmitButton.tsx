interface SubmitButtonProps {
  text: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const BASE_CLASSES =
  "w-full rounded-[14px] bg-main py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-main/90 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

export function SubmitButton({
  text,
  className,
  disabled = false,
  loading = false,
}: SubmitButtonProps) {
  const composed = className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES;
  return (
    <button type="submit" className={composed} disabled={disabled || loading}>
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {text}
        </span>
      ) : (
        text
      )}
    </button>
  );
}