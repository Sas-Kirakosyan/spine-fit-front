import { Button } from "@/components/Buttons/Button";
import { ChevronLeftIcon } from "@/components/Icons/Icons";

interface AvailableEquipmentPageHeaderProps {
  onNavigateBack: () => void;
}

export function AvailableEquipmentPageHeader({
  onNavigateBack,
}: AvailableEquipmentPageHeaderProps) {
  return (
    <header className="flex items-center gap-2 mt-2 px-3">
      <Button
        onClick={onNavigateBack}
        className="flex items-center justify-center w-8 h-8 text-white"
        ariaLabel="Go back"
      >
        <ChevronLeftIcon />
      </Button>
      <div className="text-2xl font-semibold text-white flex-1">
        Available Equipment
      </div>
      <Button className="flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-full transition-colors">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </Button>
    </header>
  );
}
