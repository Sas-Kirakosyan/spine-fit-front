import React from "react";

interface SubmitButtonProps {
  text: string;
  className?: string;
}

export function SubmitButton({
  text,
  className = "w-full rounded-[14px] bg-[#0000E7] py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
}: SubmitButtonProps) {
  return (
    <button type="submit" className={className}>
      {text}
    </button>
  );
}

