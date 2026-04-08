import { Button } from "@/components/Buttons/Button";
import { ChevronRightIcon } from "@/components/Icons/Icons";

interface SettingsRowProps {
  label: string;
  value?: string;
  onClick?: () => void;
}

export function SettingsRow({ label, value, onClick }: SettingsRowProps) {
  return (
    <Button
      onClick={onClick}
      className="w-full flex items-center justify-between text-left"
    >
      <span className="text-base font-medium text-white">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-base font-medium text-white">{value}</span>
        )}
        <ChevronRightIcon className="h-5 w-5" />
      </div>
    </Button>
  );
}
