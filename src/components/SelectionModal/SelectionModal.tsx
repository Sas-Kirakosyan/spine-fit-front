import { useState, useEffect } from "react";
import { Button } from "@/components/Buttons/Button";
import { SelectionRadioOption } from "./SelectionRadioOption";

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  descriptions?: string[];
  headerDescription?: string;
  selectedValue: string;
  onSelect: (value: string) => void;
}

export function SelectionModal({
  isOpen,
  onClose,
  title,
  options,
  descriptions,
  headerDescription,
  selectedValue,
  onSelect,
}: SelectionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const index = options.findIndex((opt) => opt === selectedValue);
      setSelectedIndex(index >= 0 ? index : null);
    }
  }, [isOpen, options, selectedValue]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onSelect(options[index]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full md:items-center md:justify-center md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full h-full md:max-w-[400px] md:h-auto">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-10 flex flex-col h-full md:min-h-[700px]">
          <div className="flex flex-col flex-1 justify-between min-h-0">
            {/* Header */}
            <div className="flex items-start justify-between mt-5 text-white px-4">
              <div>
                <h2 className="text-2xl font-semibold">{title}</h2>
              </div>
              <Button
                onClick={onClose}
                className="flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                Close
              </Button>
            </div>

            {/* Header Description */}
            {headerDescription && (
              <div className="mt-4 mx-4 px-4 py-3 rounded-lg bg-main/80">
                <p className="text-sm text-white">{headerDescription}</p>
              </div>
            )}

            {/* Options List */}
            <div className="mt-6 px-2 md:ml-[10px] md:mr-[10px] flex-1 overflow-y-auto">
              <div className="rounded-2xl bg-blue-900/40 p-4 md:p-6 text-gray-800 shadow-lg backdrop-blur">
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <SelectionRadioOption
                      key={index}
                      option={option}
                      description={descriptions?.[index]}
                      index={index}
                      isSelected={selectedIndex === index}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
