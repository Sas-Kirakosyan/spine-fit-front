import React from "react";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

export function FormCard({ children, className = "" }: FormCardProps) {
  return (
    <div className={`rounded-[14px] bg-white p-6 shadow-lg backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

