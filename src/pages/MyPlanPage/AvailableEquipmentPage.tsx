import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { AvailableEquipmentPageProps } from "@/types/pages";
import type {
  EquipmentTab,
  EquipmentCategory,
  EquipmentItem as EquipmentItemType,
} from "@/types/equipment";
import equipmentsData from "@/MockData/equipments.json";
import { Button } from "@/components/Buttons/Button";
import { ChevronLeftIcon } from "@/components/Icons/Icons";
import { EquipmentItem } from "@/components/EquipmentItem/EquipmentItem";
import { createEquipmentData } from "@/utils/equipment";

export function AvailableEquipmentPage({
  onNavigateBack,
}: AvailableEquipmentPageProps) {
  const [activeTab, setActiveTab] = useState<EquipmentTab>("all");

  const loadEquipmentData = (): EquipmentCategory[] => {
    return createEquipmentData(equipmentsData as RawEquipmentData[]);
  };

  const [equipmentData, setEquipmentData] = useState<EquipmentCategory[]>(
    loadEquipmentData()
  );

  useEffect(() => {
    try {
      localStorage.setItem("equipmentData", JSON.stringify(equipmentData));
      dispatchEvent(new Event("equipmentDataUpdated"));
    } catch (error) {
      console.error("Error saving equipment data:", error);
    }
  }, [equipmentData]);

  const toggleEquipmentSelection = (categoryId: string, itemId: string) => {
    setEquipmentData((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, selected: !item.selected } : item
            ),
          };
        }
        return category;
      })
    );
  };

  const filteredData = useMemo(() => {
    if (activeTab === "selected") {
      return equipmentData
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => item.selected),
        }))
        .filter((category) => category.items.length > 0);
    }
    return equipmentData;
  }, [equipmentData, activeTab]);

  const formatWeights = (weights: EquipmentItemType["weights"]) => {
    if (weights.length === 0) {
      return "No weights";
    }
    const sorted = [...weights].sort((a, b) => a.weight - b.weight);
    const display = sorted.slice(0, 4);
    const remaining = sorted.length - display.length;
    const displayText = display
      .map((w) => `${w.weight.toFixed(1)} ${w.unit}`)
      .join(", ");
    return remaining > 0 ? `${displayText}...` : displayText;
  };
  console.log({ filteredData });
  return (
    <PageContainer contentClassName="gap-0 px-0">
      {/* Header */}
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

      {/* Tabs */}
      <div className="flex gap-2 px-3 mt-4">
        {(["all", "selected"] as EquipmentTab[]).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900"
                : "bg-[#1B1E2B] text-gray-400"
            }`}
          >
            {tab === "all" ? "All" : "Selected"}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 mt-4">
        {filteredData.map((category) => (
          <div key={category.id} className="mb-6">
            <h2 className="text-base font-semibold text-white mb-3">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <EquipmentItem
                  key={item.id}
                  item={item}
                  onToggleSelection={() =>
                    toggleEquipmentSelection(category.id, item.id)
                  }
                  formatWeights={formatWeights}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
