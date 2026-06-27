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
      className="w-full flex items-center justify-between gap-3 text-left"
    >
      <span className="min-w-0 flex-1 truncate text-base font-medium text-white">
        {label}
      </span>
      <div className="flex max-w-[55%] shrink-0 items-center gap-2">
        {value && (
          <span className="min-w-0 truncate text-base font-medium text-white">
            {value}
          </span>
        )}
        <ChevronRightIcon className="h-5 w-5 shrink-0" />
      </div>
    </Button>
  );
}
