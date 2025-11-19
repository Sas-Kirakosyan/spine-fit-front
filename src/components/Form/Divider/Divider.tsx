import React from "react";

interface DividerProps {
  text?: string;
}

export function Divider({ text = "Or continue with" }: DividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-2 text-gray-900">{text}</span>
      </div>
    </div>
  );
}

