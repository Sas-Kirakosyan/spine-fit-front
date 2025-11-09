import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  backgroundImage?: string;
  overlayClassName?: string;
  contentClassName?: string;
  minHeightClassName?: string;
  isStandalone?: boolean;
  fallbackBackgroundClassName?: string;
}

export function PageContainer({
  children,
  backgroundImage,
  overlayClassName = "bg-black/40",
  contentClassName = "",
  minHeightClassName = "min-h-[640px]",
  isStandalone = true,
  fallbackBackgroundClassName = "bg-gray-700",
}: PageContainerProps) {
  const hasBackgroundImage = Boolean(backgroundImage);

  const card = (
    <div className="relative w-full max-w-[400px] ">
      <div
        className={`absolute inset-0 ${
          hasBackgroundImage
            ? "bg-cover bg-center"
            : fallbackBackgroundClassName
        }`}
        style={hasBackgroundImage ? { backgroundImage } : undefined}
      />
      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}
      <div
        className={`relative z-10 flex flex-col h-full ${minHeightClassName} px-3 py-10`}
      >
        <div className={`flex flex-col flex-1 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  if (!isStandalone) {
    return card;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      {card}
    </div>
  );
}
