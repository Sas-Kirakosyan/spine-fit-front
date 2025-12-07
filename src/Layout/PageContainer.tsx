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
  minHeightClassName = "min-h-[690px]",
  isStandalone = true,
  fallbackBackgroundClassName = "bg-gray-700",
}: PageContainerProps) {
  const hasBackgroundImage = Boolean(backgroundImage);

  const card = (
    <div className="relative w-[400px] min-h-screen">
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
        className={`relative z-10 flex flex-col min-h-screen ${minHeightClassName} overflow-y-auto`}
      >
        <div className={`relative flex flex-col flex-1 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  if (!isStandalone) {
    return card;
  }

  return (
    <div className="bg-white flex items-center justify-center min-h-screen">
      {card}
    </div>
  );
}
