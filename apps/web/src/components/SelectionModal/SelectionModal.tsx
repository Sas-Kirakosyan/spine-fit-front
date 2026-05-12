import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Buttons/Button";
import { ChevronLeftIcon } from "@/components/Icons/Icons";
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

  const initialIndex = options.findIndex((opt) => opt === selectedValue);
  const hasChanges =
    selectedIndex !== null && selectedIndex !== initialIndex;

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleSave = () => {
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
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-3 mt-5 text-white px-4">
          <Button
            onClick={onClose}
            ariaLabel={t("selectionModal.back")}
            className="flex items-center justify-center h-10 w-10 rounded-full text-white transition hover:bg-white/10"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Button>
          <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
        </div>

        {headerDescription && (
          <div className="mt-4 mx-4 px-4 py-3 rounded-lg bg-main/80">
            <p className="text-sm text-white">{headerDescription}</p>
          </div>
        )}

        <div className="mt-4 px-2 md:px-4 pb-4 flex-1">
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

        <div className="sticky bottom-0 px-4 pt-3 pb-6 bg-background">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full flex justify-center items-center h-[46px] rounded-[10px] bg-main text-white uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("selectionModal.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
