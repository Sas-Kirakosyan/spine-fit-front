import React from "react";

interface FormHeaderProps {
  title: string;
  subtitle?: string;
}

export function FormHeader({ title, subtitle }: FormHeaderProps) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-[#0000E7]">{title}</h2>
      {subtitle && <p className="mt-1 text-gray-900">{subtitle}</p>}
    </div>
  );
}

