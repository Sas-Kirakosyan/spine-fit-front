interface SubmitButtonProps {
  text: string;
  className?: string;
}

export function SubmitButton({
  text,
  className = "w-full rounded-[14px] bg-main py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-main/90 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2",
}: SubmitButtonProps) {
  return (
    <button type="submit" className={className}>
      {text}
    </button>
  );
}
