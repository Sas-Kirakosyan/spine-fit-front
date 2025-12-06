import { Button } from "@/components/Buttons/Button";
import { ChevronLeftIcon } from "@/components/Icons/Icons";

interface MyPlanPageHeaderProps {
  onNavigateBack: () => void;
}

export function MyPlanPageHeader({ onNavigateBack }: MyPlanPageHeaderProps) {
  return (
    <header className="flex items-center gap-2 mt-2">
      <Button
        onClick={onNavigateBack}
        className="flex items-center justify-center w-8 h-8 text-white"
        ariaLabel="Go back"
      >
        <ChevronLeftIcon />
      </Button>
      <div className="text-2xl font-semibold text-white">My Plan</div>
    </header>
  );
}
