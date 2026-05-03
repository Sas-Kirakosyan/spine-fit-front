import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { Dialog } from "@/components/ui/Modal";
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
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const index = options.findIndex((opt) => opt === selectedValue);
      setSelectedIndex(index >= 0 ? index : null);
    }
  }, [isOpen, options, selectedValue]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleApply = () => {
    if (selectedIndex !== null) {
      onSelect(options[selectedIndex]);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      ariaLabel={title}
      className="bg-background"
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between mt-5 text-white px-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
          </div>
          <Button
            onClick={handleApply}
            className="flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            {t("selectionModal.close")}
          </Button>
        </div>

        {headerDescription && (
          <div className="mt-4 mx-4 px-4 py-3 rounded-lg bg-main/80">
            <p className="text-sm text-white">{headerDescription}</p>
          </div>
        )}

        <div className="mt-4 px-2 md:px-4 pb-6 flex-1">
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
    </Dialog>
  );
}
