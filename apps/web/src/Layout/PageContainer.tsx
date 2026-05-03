import type { ReactNode } from "react";

export type PageContainerWidthMode = "phone" | "wide";

interface PageContainerProps {
  children: ReactNode;
  backgroundImage?: string;
  backgroundPositionClassName?: string;
  overlayClassName?: string;
  contentClassName?: string;
  minHeightClassName?: string;
  isStandalone?: boolean;
  fallbackBackgroundClassName?: string;
  widthMode?: PageContainerWidthMode;
}

const widthClasses: Record<PageContainerWidthMode, string> = {
  phone: "max-w-[440px]",
  wide: "max-w-[440px] md:max-w-screen-xl",
};

export function PageContainer({
  children,
  backgroundImage,
  backgroundPositionClassName = "bg-center",
  overlayClassName = "bg-black/40",
  contentClassName = "",
  minHeightClassName = "min-h-[690px]",
  isStandalone = true,
  fallbackBackgroundClassName = "bg-background",
  widthMode = "wide",
}: PageContainerProps) {
  const hasBackgroundImage = Boolean(backgroundImage);
  const widthClass = widthClasses[widthMode];

  const card = (
    <div className={`relative w-full ${widthClass} min-h-screen`}>
      <div
        className={`absolute inset-0 ${
          hasBackgroundImage
            ? `bg-cover ${backgroundPositionClassName}`
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

  const outerBgClass =
    widthMode === "phone"
      ? "bg-white md:bg-background"
      : "bg-background";

  return (
    <div
      className={`${outerBgClass} flex items-center justify-center min-h-screen`}
    >
      {card}
    </div>
  );
}
