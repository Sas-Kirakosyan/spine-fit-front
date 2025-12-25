interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

export function FormCard({ children, className = "" }: FormCardProps) {
  return (
    <div
      className={`rounded-[14px] bg-white p-5 mx-2.5 shadow-lg backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
